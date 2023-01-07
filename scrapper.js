const request = require("request-promise");
const cheerio = require("cheerio");

// Load HTML from a URL
async function loadURL(url) {
  const options = {
    url: url,
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.77 Safari/537.36",
    },
  };
  try {
    let html = await request(options);
    return html;
  } catch {
    console.error("Error!!!");
    return "... URL Load Error!!!";
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
    if (!currency) {
      currency = $(this).find(".itemUsedAndNewPrice").text();
      //remove spaces
      currency = currency.replace(/\s/g, "");
      currency = currency.slice(0, 1);
    }
    let name = $(this).find("h3 .a-link-normal").attr("title") ?? "";
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
        currency: currency ? currency : "None",
        value: price === "-Infinity" ? 0 : price,
      },
      url: link,
      website: "amazon",
    });
  });
  return results;
}

module.exports = productScraper;
