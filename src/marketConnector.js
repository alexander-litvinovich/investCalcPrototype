import assetStab from "./asset_stab.json";

const cache = {};

async function marketTickerPrice(ticker) {
  if (!cache[ticker]) {
    const json = await fetch(
      `https://iss.moex.com/iss/engines/stock/markets/shares/securities/${ticker}.json`
    ).then(function (res) {
      return res.json();
    });
    cache[ticker] = parseFloat(
      json.marketdata.data.filter(function (d) {
        return ["TQBR", "TQTF"].indexOf(d[1]) !== -1;
      })[0][12]
    );
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
