const dayjs = require("dayjs");
import ASSET_TYPE_BY_TICKER from "./tickerTypes.json";
import { marketTickerPrice } from "./marketConnector";

const DATE_FORMAT = "DD.MM.YYYY";

const getTickers = async (data) => {
  const tickerPrices = {};

  for (const deal of data) {
    if (!!deal.ticker) {
      tickerPrices[deal.ticker] = await marketTickerPrice(deal.ticker);
    }
  }

  return tickerPrices;
};

const getPortfolio = (data, tickerPrices) => {
  return data.reduce((portfolio, { value, ticker, count, type, dateTime }) => {
    switch (type) {
      case "buy":
      case "sell": {
        const {
          quantity = 0,
          deals = [],
          inValue = 0.0,
          outValue = 0.0,
          currentValue = 0.0
        } = portfolio[ticker] || {};

        return {
          ...portfolio,
          [ticker]: {
            quantity: quantity + getMultiplier(type) * count,
            assetType: getAssetTypeByTicker(ticker),
            inValue: inValue + (getMultiplier(type) > 0 && count * value),
            outValue: outValue + (getMultiplier(type) < 0 && count * value),
            currentValue:
              currentValue +
              (getMultiplier(type) > 0 && count * tickerPrices[ticker]),
            deals: [
              ...deals,
              {
                type,
                count,
                value,
                dateTime: dayjs(dateTime, DATE_FORMAT)
              }
            ]
          }
        };
      }
      case "add":
      case "remove":
      case "commission": {
        const { quantity = 0, deals = [] } = portfolio["money"] || {};
        return {
          ...portfolio,
          ["money"]: {
            quantity: quantity + getMultiplier(type) * value,
            deals: [
              ...deals,
              {
                type,
                count: 1,
                value,
                dateTime: dayjs(dateTime, DATE_FORMAT)
              }
            ]
          }
        };
      }
      default:
        return portfolio;
    }
  }, {});
};

const MULTIPLIER_BY_TYPE = {
  buy: 1,
  sell: -1,
  commission: -1,
  add: 1,
  remove: -1
};

const getMultiplier = (type) => {
  return MULTIPLIER_BY_TYPE[type] || 0;
};

const getAssetTypeByTicker = (ticker) => {
  return ASSET_TYPE_BY_TICKER[ticker] || false;
};

export { getPortfolio, getTickers };
