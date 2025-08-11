import puppeteer from "puppeteer";
import { BASE_URL, HEADERS, PUPPETEER_OPTIONS } from "../config/puppeteer.js";

export async function getDescriptionWithPuppeteer(browser, url) {
  let page;
  try {
    page = await browser.newPage();
    await page.setUserAgent(HEADERS["User-Agent"]);
    await page.setViewport({ width: 1200, height: 800 });

    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });

    await Promise.race([
      page.waitForSelector(
        "iframe#desc_ifr, iframe[title*='description'], iframe[src*='ebaydesc']",
        { timeout: 8000 }
      ),
      page.waitForSelector(
        ".x-item-description-child, #viTabs_0_is, #desc_div",
        { timeout: 8000 }
      ),
    ]);

    const iframeHandle =
      (await page.$("iframe#desc_ifr")) ||
      (await page.$('iframe[title*="description"]')) ||
      (await page.$('iframe[src*="ebaydesc"]'));

    if (iframeHandle) {
      const frame = await iframeHandle.contentFrame();
      if (frame) {
        const text = await frame.evaluate(() =>
          (document.body?.innerText || "").replace(/\s+/g, " ").trim()
        );
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
      const exists = await page.$(sel);
      if (exists) {
        const text = await page.$eval(
          sel,
          (el) => el.innerText || el.textContent || ""
        );
        await page.close();
        return (text || "-").replace(/\s+/g, " ").trim();
      }
    }

    await page.close();
    return "-";
  } catch (err) {
    if (page) await page.close();
    console.error(`Puppeteer error for ${url}:`, err.message);
    return "-";
  }
}

export async function scrapeEbayProducts(pageNum, limit) {
  const url = `${BASE_URL}${pageNum}`;
  const browser = await puppeteer.launch(PUPPETEER_OPTIONS);
  const page = await browser.newPage();

  await page.setUserAgent(HEADERS["User-Agent"]);
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });

  await page.waitForSelector(".s-item", { timeout: 15000 });

  const products = await page.evaluate((limit) => {
    const items = [];
    document.querySelectorAll(".s-item").forEach((el) => {
      if (items.length >= limit) return;
      const title = el.querySelector(".s-item__title")?.innerText.trim() || "-";
      const price = el.querySelector(".s-item__price")?.innerText.trim() || "-";
      const link = el.querySelector(".s-item__link")?.href || "-";
      if (
        link &&
        link.startsWith("http") &&
        title &&
        title.toLowerCase() !== "shop on ebay"
      ) {
        items.push({ title, price, link, description: "-" });
      }
    });
    return items;
  }, limit);

  for (let i = 0; i < products.length; i++) {
    products[i].description = await getDescriptionWithPuppeteer(
      browser,
      products[i].link
    );
    await new Promise((r) => setTimeout(r, 500));
  }

  await browser.close();
  return products;
}
