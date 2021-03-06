/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-var-requires */
const fs = require("fs");
const path = require("path");

const MINIMUM_STATEMENTS = 90;
const MINIMUM_BRANCHES = 75;
const MINIMUM_INDIVIDUAL = 50;

let fileData;

try {
  const filePath = path.join(
    process.env.PWD,
    "coverage-all",
    "coverage-summary.json"
  );
  // we can read synchronously here because there's no UI and we don't want to continue if it fails
  fileData = JSON.parse(fs.readFileSync(filePath, "utf-8"));
} catch (error) {
  console.error("Could not read coverage summary", error);
  process.exit(1);
}

const coverageShortfalls = {};
try {
  if (fileData.total.statements.pct < MINIMUM_STATEMENTS) {
    coverageShortfalls.totalStatements = fileData.total.statements.pct;
  }
  if (fileData.total.branches.pct < MINIMUM_BRANCHES) {
    coverageShortfalls.totalBranches = fileData.total.branches.pct;
  }
  Object.keys(fileData).forEach((key) => {
    if (key === "total") {
      return;
    }
    if (fileData[key].statements.pct < MINIMUM_INDIVIDUAL) {
      coverageShortfalls[`${key}_statement`] = fileData[key].statements.pct;
      console.log(
        `File statements coverage for ${key} is ${fileData[key].statements.pct}`
      );
    }
    if (fileData[key].branches.pct < MINIMUM_INDIVIDUAL) {
      coverageShortfalls[`${key}_branch`] = fileData[key].branches.pct;
      console.log(
        `File branches coverage for ${key} is ${fileData[key].branches.pct}`
      );
    }
  });
} catch (error) {
  console.error("Could not collect coverage data, ", error);
  process.exit(1);
}

console.log(`Total statement coverage is ${fileData.total.statements.pct}%`);
console.log(`Total branch coverage is ${fileData.total.branches.pct}%`);

if (Object.keys(coverageShortfalls).length) {
  console.error("Test coverage is below required levels.");
  if (coverageShortfalls.totalStatements) {
    console.log(
      `Total statement coverage is ${coverageShortfalls.totalStatements}% but should be at least ${MINIMUM_STATEMENTS}%`
    );
  }
  if (coverageShortfalls.totalBranches) {
    console.log(
      `Total branch coverage is ${coverageShortfalls.totalBranches}% but should be at least ${MINIMUM_BRANCHES}%`
    );
  }
  Object.keys(coverageShortfalls).forEach((key) => {
    if (key === "totalBranches" || key === "totalStatements") {
      return;
    }
    const underScoreIndex = key.lastIndexOf("_");
    const slashIndex = key.lastIndexOf("/");
    const componentName = key.substring(slashIndex + 1, underScoreIndex);
    const problemArea = key.substring(underScoreIndex + 1);
    console.log(
      `${componentName} has ${problemArea} coverage of ${coverageShortfalls[key]}% but should have at least ${MINIMUM_INDIVIDUAL}%`
    );
  });
  console.info("End test coverage report");
  process.exit(1);
}

process.exit(0);
