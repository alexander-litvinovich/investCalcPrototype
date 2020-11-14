import TYPE_BY_TICKER from "./tickerTypes.json";

const getTickers = (data) => {
  return new Set(data.reduce((tickers, deal) => [...tickers, deal.ticker], []));
};

const getPortfolio = (data) => {
  return data.reduce((portfolio, { value, ticker, count, type }) => {
    if (type === "buy" || type === "sell")
      return {
        ...portfolio,
        [ticker]: (portfolio[ticker] || 0) + getMultiplier(type) * count
      };

    if (type === "add" || type === "remove")
      return {
        ...portfolio,
        money: (portfolio["money"] || 0) + getMultiplier(type) * value
      };
  }, {});
};

const MULTIPLIER_BY_TYPE = {
  buy: 1,
  sell: -1,
  commission: 0,
  add: 1,
  remove: -1
};

const getMultiplier = (type) => {
  return MULTIPLIER_BY_TYPE[type] || 0;
};

export { getPortfolio, getTickers };
