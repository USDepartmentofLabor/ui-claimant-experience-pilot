import {
  PERSONAL_INFORMATION_ADDITIONAL_VALIDATIONS,
  PersonalInformation,
  PERSONAL_INFORMATION_SCHEMA_FIELDS,
} from "./Questions/PersonalInformation";
import { Submit, SubmitFields } from "./Questions/Submit";
import { ClaimSchemaFields } from "../common/YupBuilder";
import { FC } from "react";
import { ObjectShape } from "yup/lib/object";
import {
  DEMOGRAPHIC_INFORMATION_SCHEMA_FIELDS,
  DemographicInfo,
} from "../components/form/DemographicInfo/DemographicInfo";

interface IPage {
  path: string;
  schemaFields: ClaimSchemaFields[];
  additionalValidations?: ObjectShape;
  Component: FC;
}

export const pages: ReadonlyArray<IPage> = [
  {
    path: "personal-information",
    schemaFields: PERSONAL_INFORMATION_SCHEMA_FIELDS,
    additionalValidations: {
      ...PERSONAL_INFORMATION_ADDITIONAL_VALIDATIONS,
    },
    Component: PersonalInformation,
  },
  {
    path: "demographic-information",
    schemaFields: DEMOGRAPHIC_INFORMATION_SCHEMA_FIELDS,
    Component: DemographicInfo,
  },
  {
    path: "submit",
    schemaFields: SubmitFields,
    Component: Submit,
  },
] as const;

export type FormPath = `/claim/${typeof pages[number]["path"]}`;
