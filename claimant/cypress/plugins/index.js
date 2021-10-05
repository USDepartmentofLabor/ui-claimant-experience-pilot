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

  on("before:browser:launch", (browser = {}, launchOptions) => {
    prepareAudit(launchOptions);
  });

  on("task", {
    // log the reports, because the UI doesn't show all the relevant info
    lighthouse: lighthouse((lighthouseReport) => {
      if (console) {
        console.log(lighthouseReport); // raw lighthouse report
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
