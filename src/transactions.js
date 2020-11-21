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

const getPortfolio = (inputDeals, tickerPrices) => {
  return inputDeals.reduce((portfolio, deal) => {
    switch (deal.type) {
      case "Buy":
      case "Sell": {
        const {
          count = 0,
          deals = [],
          currentValue = tickerPrices[deal.ticker],
          error = tickerPrices[deal.ticker] === null
        } = portfolio[deal.ticker] || {};

        return {
          ...portfolio,
          [deal.ticker]: {
            error,
            currentValue,
            count: count + getMultiplier(deal.type) * deal.count,
            deals: [
              ...deals,
              {
                ...deal,
                dateTime: dayjs(deal.dateTime, DATE_FORMAT)
              }
            ]
          }
        };
      }
      case "Add":
      case "Remove":
      case "Commission": {
        const { deals = [], value = 0.0 } = portfolio["money"] || {};

        return {
          ...portfolio,
          ["money"]: {
            value: value + getMultiplier(deal.type) * deal.value,
            deals: [
              ...deals,
              {
                type: deal.type,
                value: deal.value,
                dateTime: dayjs(deal.dateTime, DATE_FORMAT)
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
    const { count, value } = deal;

    if (deal.type === "Buy") {
      dealStack.push({
        count,
        value
      });
      resultDeals.push({ ...deal });
    }

    if (deal.type === "Sell") {
      let sellCount = count;
      let sellProfit = count * value;

      while (sellCount > 0) {
        const { count: prevCount, value: prevValue } = dealStack.pop();

        if (sellCount >= prevCount) {
          sellProfit = sellProfit - prevCount * prevValue;
          sellCount = sellCount - prevCount;
        } else {
          sellProfit = sellProfit - sellCount * prevValue;
          dealStack.push({ count: prevCount - sellCount, value: prevValue });

          sellCount = 0;
        }
      }

      resultDeals.push({ ...deal, sellProfit });
    }
  }

  return {
    count: portfolio[ticker].count,
    // inDays,
    resultDeals,
    ticker
  };
};

const MULTIPLIER_BY_TYPE = {
  Buy: 1,
  Sell: -1,
  Commission: -1,
  Dividend: 1,
  Add: 1,
  Remove: -1
};

const getMultiplier = (type) => {
  return MULTIPLIER_BY_TYPE[type] || 0;
};

const getAssetTypeByTicker = (ticker) => {
  return ASSET_TYPE_BY_TICKER[ticker] || false;
};

export { getPortfolio, getTickers, getAnalyticsByAsset };
