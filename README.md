Berikut README sederhana untuk project scraper + AI summary-mu:

---

# eBay Nike Scraper with AI Summary

Simple Express server to scrape Nike product listings from eBay, get detailed descriptions using Puppeteer, and generate summaries using OpenRouter AI (deepseek model).

---

## Features

* Scrape eBay search results for "Nike" products
* Extract title, price, link, and detailed description
* Summarize descriptions with AI into 2-3 sentence summaries
* Return JSON API response with product data and summaries

---

## Setup

1. Clone repo and install dependencies:

```bash
npm install
```

2. Change `.env.example` to `.env` file with your OpenRouter API key:

```
OPENAI_API_KEY=your_openrouter_api_key_here

```

3. Run server:

npm run dev

---

## Usage

Send GET request to `/scrape` with optional query params:

* `page` (default 1): eBay search results page number
* `limit` (default 5): max number of products to scrape

Example:

```
http://localhost:3000/scrape?page=1&limit=3
```

Response format:

```json
{
  "status": "success",
  "page": 1,
  "total": 3,
  "data": [
    {
      "title": "Nike Air Max ...",
      "price": "$99.99",
      "link": "https://...",
      "description": "...",
      "summary": "AI-generated summary..."
    },
    ...
  ]
}
```

---

## Notes

* Puppeteer fetches dynamic content for product descriptions.
* AI summary uses OpenRouter deepseek-chat-v3-0324 model.
* Handle API rate limits and errors gracefully.

---

## License

MIT License

---

Kalau perlu aku buatkan versi lebih lengkap atau dengan instruksi deploy tinggal bilang ya!
