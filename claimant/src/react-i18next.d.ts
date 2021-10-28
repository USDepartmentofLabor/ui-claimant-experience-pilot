import { resources, defaultNS } from "./i18n";

declare module "react-i18next" {
  interface CustomTypeOptions {
    defaultNS: defaultNS;
    resources: typeof resources["en"];
  }
}
