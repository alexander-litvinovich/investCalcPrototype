import "./styles.css";
import { getPortfolio, getTickers, getAnalyticsByAsset } from "./transactions";
require("dotenv").config();

const data = [];

var Airtable = require("airtable");
const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(
  process.env.AIRTABLE_DATABASE_ID
);

base("Deals")
  .select({
    sort: [{ field: "id", direction: "asc" }],
    maxRecords: 1000
  })
  .eachPage(
    function page(records, fetchNextPage) {
      records.forEach(function (record) {
        console.log("Retrieved —", record.fields);
        data.push(record.fields);
      });

      fetchNextPage();
    },
    function done(err) {
      if (err) {
        console.error(err);
        return;
      }
      console.log("done");
      run();
    }
  );

function run() {
  console.log("RUn!");
  getTickers(data).then((result) => {
    const portfolio = getPortfolio(data, result);

    console.log("tickers ?", result);
    console.log("portfolio ?", portfolio);
    console.log(
      "analytics",
      getAnalyticsByAsset(
        portfolio,
        !!window.location.hash.slice(1) ? window.location.hash.slice(1) : "YNDX"
      )
    );
  });
}
