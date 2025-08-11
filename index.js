import express from "express";
import axios from "axios";
import * as cheerio from "cheerio";
import dotenv from "dotenv";
import puppeteer from "puppeteer";

dotenv.config();
const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;
const BASE_URL =
  "https://www.ebay.com/sch/i.html?_nkw=nike&_sacat=0&_from=R40&_trksid=m570.l1313&rt=nc&_odkw=nike&_osacat=0&_pgn=";

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0 Safari/537.36",
};

async function getDescriptionWithPuppeteer(browser, url) {
  let page;

  try {
    page = await browser.newPage();
    await page.setUserAgent(HEADERS["User-Agent"]);
    await page.setViewport({ width: 1200, height: 800 });
    await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 });
    const iframeHandle =
      (await page.$("iframe#desc_ifr")) ||
      (await page.$('iframe[title*="description"]')) ||
      (await page.$('iframe[src*="ebaydesc"]'));

    if (iframeHandle) {
      const frame = await iframeHandle.contentFrame();

      if (frame) {
        const text = await frame.evaluate(() => {
          const t = document.body ? document.body.innerText : "";

          return t.replace(/\s+/g, " ").trim();
        });

        await page.close();

        return text || "-";
      }
    }

    const trySelectors = [
      ".x-item-description-child",
      "#viTabs_0_is",
      "#desc_div",
      ".item-desc",
      "#desc_ifr",
    ];
    for (const sel of trySelectors) {
      try {
        const exists = await page.$(sel);
        if (exists) {
          const text = await page.$eval(
            sel,
            (el) => el.innerText || el.textContent || ""
          );
          await page.close();
          return (text || "-").replace(/\s+/g, " ").trim();
        }
      } catch (e) {}
    }
    await page.close();
    return "-";
  } catch (err) {
    if (page) {
      try {
        await page.close();
      } catch {}
    }
    console.error(`Puppeteer error for ${url}:`, err.message);
    return "-";
  }
}
app.get("/scrape", async (req, res) => {
  const pageNum = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 5;
  if (pageNum < 1) {
    return res

      .status(400)

      .json({ status: "error", message: "Invalid page number" });
  }

  const url = `${BASE_URL}${pageNum}`;

  try {
    const { data: html } = await axios.get(url, {
      headers: HEADERS,

      timeout: 20000,
    });

    const $ = cheerio.load(html);

    const products = [];

    $(".s-item").each((i, el) => {
      if (products.length >= limit) return;

      const el$ = $(el);
      const title = el$.find(".s-item__title").text().trim() || "-";
      const price = el$.find(".s-item__price").text().trim() || "-";
      const link = el$.find(".s-item__link").attr("href") || "-";
      if (
        link &&
        link.startsWith("http") &&
        title &&
        title.toLowerCase() !== "shop on ebay"
      ) {
        products.push({ title, price, link, description: "-" });
      }
    });

    if (products.length === 0) {
      return res.json({ status: "success", page: pageNum, total: 0, data: [] });
    }

    const browser = await puppeteer.launch({
      headless: true,

      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    for (let i = 0; i < products.length; i++) {
      const p = products[i];

      p.description = await getDescriptionWithPuppeteer(browser, p.link);

      await new Promise((r) => setTimeout(r, 500));
    }

    await browser.close();

    function cleanJSON(text) {
      return text
        .replace(/```json/gi, "")
        .replace(/```/g, "")
        .trim();
    }

    async function addAISummary(products) {
      const prompt = `
You are an expert summarizer. Summarize each product description in 2-3 sentences.

Products:
${JSON.stringify(products, null, 2)}

Return only a JSON array with these keys:
- title
- price
- link
- description
- summary
`;

      try {
        const response = await axios.post(
          "https://openrouter.ai/api/v1/chat/completions",
          {
            model: "deepseek/deepseek-chat-v3-0324",
            messages: [{ role: "user", content: prompt }],
            temperature: 0,
          },
          {
            headers: {
              Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
              "Content-Type": "application/json",
            },
          }
        );

        let jsonText = response.data.choices?.[0]?.message?.content?.trim();
        jsonText = cleanJSON(jsonText);
        return JSON.parse(jsonText);
      } catch (err) {
        console.error("AI error:", err.message);
        return products.map((p) => ({ ...p, summary: "-" }));
      }
    }

    const results = await addAISummary(products);
    res.json({
      status: "success",
      page: pageNum,
      total: results.length,
      data: results,
    });
  } catch (err) {
    console.error("Scrape error:", err.message);
    return res
      .status(500)
      .json({ status: "error", message: "Server error", detail: err.message });
  }
});
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
