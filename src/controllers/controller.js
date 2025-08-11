import { scrapeEbayProducts } from "../services/scraper.js";
import { addAISummary } from "../services/addSummary.js";

export async function scrapeHandler(req, res) {
  const pageNum = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 5;

  if (pageNum < 1) {
    return res.status(400).json({ status: "error", message: "Invalid page number" });
  }

  try {
    const products = await scrapeEbayProducts(pageNum, limit);

    if (!products.length) {
      return res.json({ status: "success", page: pageNum, total: 0, data: [] });
    }

    const results = await addAISummary(products, process.env.OPENAI_API_KEY);

    res.json({
      status: "success",
      page: pageNum,
      total: results.length,
      data: results,
    });
  } catch (err) {
    console.error("Scrape error:", err.message);
    res.status(500).json({ status: "error", message: "Server error", detail: err.message });
  }
}
