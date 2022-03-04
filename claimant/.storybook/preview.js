import "../src/styles.scss";
import "@trussworks/react-uswds/lib/index.css";
import "../src/i18n";
import { initialize, mswDecorator } from "msw-storybook-addon";

// Initialize MSW
initialize();
// Provide MSW addon decorator globally
export const decorators = [mswDecorator];

export const parameters = {
  actions: { argTypesRegex: "^on[A-Z].*" },
  controls: {
    matchers: {
      color: /(background|color)$/i,
      date: /Date$/,
    },
  },
};
