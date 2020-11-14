import "./styles.css";

import data from "./transactions.json";
import { getPortfolio, getTickers } from "./transactions";

document.getElementById("app").innerHTML = `
<h1>INVEST</h1>
`;

console.log("tickers", getTickers(data));

console.log("portfolio", getPortfolio(data));
