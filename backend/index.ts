import express from 'express';
import cors from 'cors';
import puppeteer from 'puppeteer';
import dotenv from 'dotenv';
import type { Request, Response, RequestHandler } from 'express';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const DEFAULT_JAR_URL = process.env.DEFAULT_JAR_URL || '';

app.use(cors());
app.use(express.json());

const parseMonobankHandler: RequestHandler = async (req, res) => {
  const { url } = req.body;
  const jarUrl = url || DEFAULT_JAR_URL;
  if (!jarUrl.startsWith('https://send.monobank.ua/jar/')) {
    res.status(400).json({ error: 'Invalid URL' });
    return;
  }
  try {
    const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    await page.goto(jarUrl, { waitUntil: 'networkidle2' });
    await page.waitForSelector('header .field.name h1', { timeout: 10000 });
    const data = await page.evaluate(() => {
      const getText = (selector: string) => {
        const el = document.querySelector(selector);
        return el ? el.textContent?.trim() : null;
      };
      return {
        title: getText('header .field.name h1'),
        collected: getText('header .jar-stats > div:nth-child(1) .stats-data-value'),
        target: getText('header .jar-stats > div:nth-child(2) .stats-data-value'),
      };
    });
    await browser.close();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to parse page', details: error });
    return;
  }
};

app.post('/api/parse-monobank', parseMonobankHandler);

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
}); 