import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import { JSDOM } from 'jsdom';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

function extractContent(node) {
  const tagName = node.tagName?.toLowerCase();

  if (['h1','h2','h3','h4','h5','h6','p'].includes(tagName)) {
    return {
      type: tagName,
      content: node.textContent.trim(),
      children: []
    };
  }

  const children = [];
  node.childNodes.forEach(child => {
    if (child.nodeType === 1) { // Element node
      const childContent = extractContent(child);
      if (childContent) children.push(childContent);
    }
  });

  return children.length > 0 ? { type: 'group', children } : null;
}

function flattenContent(nodes, parentHeading = null) {
  const result = [];
  nodes.forEach(node => {
    if (!node) return;
    if (['h1','h2','h3','h4','h5','h6'].includes(node.type)) {
      const newHeading = { ...node, children: [] };
      result.push(newHeading);
      if (node.children.length > 0) {
        newHeading.children = flattenContent(node.children, newHeading);
      }
    } else if (node.type === 'p') {
      if (parentHeading) {
        parentHeading.children.push(node);
      } else {
        result.push(node);
      }
    } else if (node.type === 'group') {
      const groupContent = flattenContent(node.children, parentHeading);
      if (parentHeading) {
        parentHeading.children.push(...groupContent);
      } else {
        result.push(...groupContent);
      }
    }
  });
  return result;
}

async function extractStructuredContent(url, selector) {
  try {
    const response = await fetch(url);
    const html = await response.text();
    const dom = new JSDOM(html);
    const document = dom.window.document;
    const root = selector ? document.querySelector(selector) : document.body;

    if (!root) return [];

    const rawContent = [];
    root.childNodes.forEach(node => {
      if (node.nodeType === 1) {
        const content = extractContent(node);
        if (content) rawContent.push(content);
      }
    });

    return flattenContent(rawContent);
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
