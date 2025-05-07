import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import { JSDOM } from 'jsdom';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

function serializeContent(node) {
  const tagName = node.tagName?.toLowerCase();

  if (!['h1','h2','h3','h4','h5','h6','p','section','article','div'].includes(tagName)) {
    return null;
  }

  const children = [];
  node.childNodes.forEach(child => {
    if (child.nodeType === 1) { // Element node
      const childSerialized = serializeContent(child);
      if (childSerialized) children.push(childSerialized);
    } else if (child.nodeType === 3) { // Text node
      const text = child.textContent.trim();
      if (text) children.push({ type: 'text', content: text });
    }
  });

  if (['h1','h2','h3','h4','h5','h6','p'].includes(tagName)) {
    return {
      type: tagName,
      content: node.textContent.trim()
    };
  }

  return { type: tagName, children };
}

async function extractStructuredContent(url, selector) {
  try {
    const response = await fetch(url);
    const html = await response.text();
    const dom = new JSDOM(html);
    const document = dom.window.document;
    const root = selector ? document.querySelector(selector) : document.body;

    if (!root) return [];

    const result = [];
    root.childNodes.forEach(node => {
      const serialized = serializeContent(node);
      if (serialized) result.push(serialized);
    });

    return result;
  } catch (err) {
    console.error(err);
    return [];
  }
}

app.post('/compare', async (req, res) => {
  const { url1, url2, selector1, selector2 } = req.body;
  const [data1, data2] = await Promise.all([
    extractStructuredContent(url1, selector1),
    extractStructuredContent(url2, selector2)
  ]);
  res.json({ url1: data1, url2: data2 });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
