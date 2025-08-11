export const BASE_URL =
  "https://www.ebay.com/sch/i.html?_nkw=nike&_sacat=0&_from=R40&_trksid=m570.l1313&rt=nc&_odkw=nike&_osacat=0&_pgn=";

export const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0 Safari/537.36",
};

export const PUPPETEER_OPTIONS = {
  headless: true,
  args: ["--no-sandbox", "--disable-setuid-sandbox"],
};
