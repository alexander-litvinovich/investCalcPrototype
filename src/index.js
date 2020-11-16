import "./styles.css";

import data from "./transactions.json";
import { getPortfolio, getTickers } from "./transactions";

document.getElementById("app").innerHTML = ``;

function run() {
  getTickers(data).then((result) => {
    console.log("tickers ?", result);
    console.log("portfolio ?", getPortfolio(data, result));
  });
}

run();
