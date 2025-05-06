import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import { JSDOM } from 'jsdom';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.post('/compare', async (req, res) => {
  const { url1, url2, selector } = req.body;

  async function extractContent(url) {
    try {
      const response = await fetch(url);
      const html = await response.text();
      const dom = new JSDOM(html);
      const document = dom.window.document;
      const root = selector ? document.querySelector(selector) : document.body;

      if (!root) return { headings: [], paragraphs: [] };

      const headings = Array.from(root.querySelectorAll('h1,h2,h3,h4,h5,h6'))
        .map((el) => el.textContent.trim())
        .filter(Boolean);

      const paragraphs = Array.from(root.querySelectorAll('p'))
        .map((el) => el.textContent.trim())
        .filter(Boolean);

      return { headings, paragraphs };
    } catch (err) {
      console.error(err);
      return { headings: [], paragraphs: [] };
    }
  }

  const [data1, data2] = await Promise.all([extractContent(url1), extractContent(url2)]);
  res.json({ url1: data1, url2: data2 });
});


app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
