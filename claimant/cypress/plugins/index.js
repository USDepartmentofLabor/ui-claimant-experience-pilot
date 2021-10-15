/// <reference types="cypress" />
// ***********************************************************
// This example plugins/index.js can be used to load plugins
//
// You can change the location of this file or turn off loading
// the plugins file with the 'pluginsFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/plugins-guide
// ***********************************************************

// This function is called when a project is opened or re-opened (e.g. due to
// the project's config changing)

/**
 * @type {Cypress.PluginConfig}
 */
/* eslint-disable @typescript-eslint/no-unused-vars, no-undef, @typescript-eslint/no-var-requires */
const { lighthouse, pa11y, prepareAudit } = require("cypress-audit");
const { linkSync } = require("fs");

module.exports = (on, config) => {
  // `on` is used to hook into various events Cypress emits
  // `config` is the resolved Cypress config

  require("@cypress/code-coverage/task")(on, config);
  on("task", {
    log(message) {
      if (console) {
        console.log(message);
      }
      return null;
    },
  });

  on("before:browser:launch", (browser, launchOptions) => {
    prepareAudit(launchOptions);
  });

  on("task", {
    // log the reports, because the UI doesn't show all the relevant info
    // See https://github.com/GoogleChrome/lighthouse/blob/master/docs/understanding-results.md#lighthouse-result-object-lhr
    lighthouse: lighthouse((results) => {
      const lh = results.lhr;
      if (console) {
        console.log(
          `--- Lighthouse ${lh.lighthouseVersion} at ${lh.fetchTime} ---`
        );
        console.log(`Final URL: ${lh.finalUrl}`);
        if (lh.runtimeError) {
          console.log(`ERROR: ${lh.runtimeError}`);
        }
        if (lh.runWarnings) {
          console.log(`Warnings:\n  ${lh.runWarnings.join("\n  ")}`);
        }
        console.log("CATEGORIES");
        Object.entries(lh.categories).forEach(([key, cat]) => {
          console.log(`*  ${cat.id} ${cat.score}`);
        });
        console.log("AUDITS");
        Object.entries(lh.audits).forEach(([key, audit]) => {
          const hasDetails =
            /^(table|debugdata|criticalrequestchain)$/.test(
              audit.details?.type
            ) && audit.details?.items?.length;
          if (audit.score === null && !hasDetails) {
            return;
          }
          console.log(
            `*  ${audit.id}: ${audit.score} ${audit.displayValue ?? ""}`
          );
          if (hasDetails) {
            console.log(JSON.stringify(audit.details.items, null, 2));
          }
        });

        // console.log(lh.lhr); // raw lighthouse report
      }
    }),
    pa11y: pa11y((pa11yReport) => {
      if (console) {
        console.log(pa11yReport); // raw pa11y report
      }
    }),
  });
  return config;
};
