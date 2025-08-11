import express from "express";
import dotenv from "dotenv";
import { scrapeHandler } from "./controllers/controller.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

app.get("/scrape", scrapeHandler);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
