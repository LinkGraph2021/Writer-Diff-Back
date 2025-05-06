const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

function extractText(html, selector = null) {
  const $ = cheerio.load(html);
  const scope = selector ? $(selector) : $('body');
  const elements = [];

  scope.find('h1,h2,h3,h4,h5,h6,p').each((_, el) => {
    const text = $(el).text().trim();
    if (text) elements.push(text);
  });

  return elements;
}

app.post('/compare', async (req, res) => {
  const { url1, url2, selector1, selector2 } = req.body;

  try {
    const [res1, res2] = await Promise.all([
      axios.get(url1),
      axios.get(url2),
    ]);

    const content1 = extractText(res1.data, selector1);
    const content2 = extractText(res2.data, selector2);

    res.json({ content1, content2 });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: 'Failed to fetch or parse one of the URLs.' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
