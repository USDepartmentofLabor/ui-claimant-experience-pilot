import {
  PersonalInformation,
  PersonalInformationFields,
} from "./Questions/PersonalInformation";
import { Submit, SubmitFields } from "./Questions/Submit";

export const pages = [
  {
    path: "personal-information",
    fields: PersonalInformationFields,
    Component: PersonalInformation,
  },
  {
    path: "submit",
    fields: SubmitFields,
    Component: Submit,
  },
] as const;

export type FormPath = `/claim/${typeof pages[number]["path"]}`;
