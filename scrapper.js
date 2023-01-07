const cheerio = require("cheerio");
const puppeteer = require("puppeteer");

// Load HTML from a URL
async function loadURL(url) {
  try {
    const browser = await puppeteer.launch({
      headless: false,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();
    await page.goto(url);

    // scroll down to load all products
    await page.evaluate(async () => {
      await new Promise((resolve, reject) => {
        let totalHeight = 0;
        let distance = 100;
        let timer = setInterval(() => {
          let scrollHeight = document.body.scrollHeight;
          window.scrollBy(0, distance);
          totalHeight += distance;

          if (totalHeight >= scrollHeight) {
            clearInterval(timer);
            resolve();
          }
        }, 100);
      });
    });

    let html = await page.content();
    await browser.close();
    return html;
  } catch (error) {
    console.log(error);
    return "Error";
  }
}

// Extract product information from Amazon Wish List URL
async function productScraper(url) {
  let results = [];
  let html = await loadURL(url);
  let $ = cheerio.load(html);
  const wishlistDiv = $("#wl-item-view", html);
  const wishlistItems = $("#g-items", wishlistDiv);

  $(".g-item-sortable", wishlistItems).each(function () {
    let price = $(this).attr("data-price");
    let currency = $(this).find(".a-price-symbol").text();

    // check if currency has numbers
    if (!currency || currency.match(/\d/)) {
      currency = $(this).find(".itemUsedAndNewPrice").text();
      //remove spaces
      currency = currency.replace(/\s/g, "");
      currency = currency.slice(0, 1);
    }
    let name = $(this).find(".a-link-normal").attr("title") ?? "";
    let image = $(this).find(".g-itemImage img").attr("src") ?? "";
    let params = JSON.parse($(this).attr("data-reposition-action-params"));
    let randomize = Math.floor(Math.random() * 1000000000000000);
    let barcode = randomize.toString();

    let ASIN = params.itemExternalId.slice(5, 15);
    let link = `https://www.amazon.de/-/en/dp/${ASIN}`;

    results.push({
      barcode: barcode,
      image: image,
      name: name,
      price: {
        currency: currency ? currency[0] : "None",
        value: price === "-Infinity" ? 0 : price,
      },
      url: link,
      website: "amazon",
    });
  });
  return results;
}

module.exports = productScraper;
