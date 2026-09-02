const fs = require("fs");
const dotenv = require("dotenv");

const parsed = dotenv.parse(fs.readFileSync(".env.local"));

for (const key of Object.keys(parsed)) {
  const value = parsed[key];

  console.log(
    key,
    "length=" + value.length,
    "hasDollar=" + value.includes("$"),
    "hasExpansion=" + value.includes("${")
  );
}