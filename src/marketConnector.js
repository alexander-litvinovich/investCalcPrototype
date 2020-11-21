import assetStab from "./asset_stab.json";

const Micex = require("micex.api");

const cache = {};

async function marketTickerPrice(inputTicker) {
  const ticker = inputTicker.toLowerCase();

  if (!cache[ticker]) {
    
    try {
      const marketData = await Micex.securityMarketdata(ticker);
      cache[ticker] = marketData["LAST"];
      
    } catch (error) {
      
      return null;
    }


  }
  return cache[ticker];
}

function marketTickerPriceStab(ticker) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(assetStab[0][ticker]);
    }, 30);
  });
}

export { marketTickerPrice, marketTickerPriceStab };
