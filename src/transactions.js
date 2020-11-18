const dayjs = require("dayjs");
const duration = require("dayjs/plugin/duration");
dayjs.extend(duration);

import ASSET_TYPE_BY_TICKER from "./tickerTypes.json";
import { marketTickerPrice } from "./marketConnector";

const DATE_FORMAT = "YYYY-MM-DD";

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
      case "Buy":
      case "Sell": {
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
      case "Add":
      case "Remove":
      case "Commission": {
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

const getAnalyticsByAsset = (portfolio, ticker) => {
  const resultDeals = [];
  const dealStack = [];

  let summaryDelta = 0;
  let inDays = 0;

  console.log("inAnalytics: ", portfolio[ticker]);

  const firstDeal = portfolio[ticker].deals[0].dateTime;
  const lastDeal =
    portfolio[ticker].deals[portfolio[ticker].deals.length - 1].dateTime;

console.log(firstDeal, lastDeal);

  // if (portfolio[ticker].deals.length > 1) {
  //   inDays = lastDeal.dateTime.diff(firstDeal, "day");
  // } else {
  //   inDays = dayjs().diff(firstDeal, "day");
  // }

  for (const deal of portfolio[ticker].deals) {
    if (deal.type === "Buy") {
      dealStack.push({
        count: deal.count,
        value: deal.value
      });
      resultDeals.push({ ...deal });

      console.log("stacks", dealStack, resultDeals);
    }

    if (deal.type === "Sell") {
      let sellCount = deal.count;
      let delta = 0;

      while (sellCount > 0) {
        const lastDeal = dealStack.pop();

        if (sellCount < lastDeal.count) {
          delta += sellCount * deal.value - sellCount * lastDeal.value;

          lastDeal.count = lastDeal.count - sellCount;
          sellCount = 0;
          dealStack.push(lastDeal);
        } else {
          delta += deal.value * deal.count - lastDeal.value * lastDeal.count;
          sellCount = sellCount - lastDeal.count;
        }
      }

      summaryDelta += delta;
      resultDeals.push({ ...deal, delta });
    }
  }

  return {
    quantity: portfolio[ticker].quantity,
    inDays,
    summaryDelta,
    resultDeals
  };
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

export { getPortfolio, getTickers, getAnalyticsByAsset };
