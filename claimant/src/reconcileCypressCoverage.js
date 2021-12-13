/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-var-requires */
const fs = require("fs");
const path = require("path");

const cypressPath = path.join(
  process.env.PWD,
  "coverage-cypress",
  "coverage-final.json"
);
const cypressCoverage = JSON.parse(fs.readFileSync(cypressPath, "utf-8"));

// because we instrument on the Docker container but run outside in the native host,
// sometimes the lazy-loaded path names do not align. This fixup just makes sure we
// are always referring to the local (native) filesystem paths.
const cwd = process.cwd();
Object.keys(cypressCoverage).forEach((key) => {
  if (key.startsWith("/app/claimant/src")) {
    const localPath = key.replace("/app/claimant", cwd);
    if (cypressCoverage[localPath]) {
      const coverage = cypressCoverage[key];
      coverage.path = localPath;
      cypressCoverage[localPath] = coverage;
      delete cypressCoverage[key];
    }
  }
});

fs.writeFileSync(cypressPath, JSON.stringify(cypressCoverage));
