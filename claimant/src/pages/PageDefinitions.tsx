import { PersonalInformationPage } from "./Questions/PersonalInformation/PersonalInformation";
import { DemographicInformationPage } from "./Questions/DemographicInformation/DemographicInformation";
import { EmployerInformationPage } from "./Questions/EmployerInformation/EmployerInformation";
import { SubmitPage } from "./Questions/Submit/Submit";
import { ClaimSchemaField } from "../common/YupBuilder";
import { FC } from "react";
import { SelfEmploymentPage } from "./Questions/SelfEmployment/SelfEmployment";

export interface IPageDefinition {
  path: string;
  schemaFields: ClaimSchemaField[];
  initialValues: FormValues;
  Component: FC<PageProps>;
  repeatable?: (
    currentSegment: string | undefined,
    values: FormValues
  ) => boolean;
  nextSegment?: (currentSegment: string | undefined) => string | false;
  previousSegment?: (currentSegment: string | undefined) => string | false;
}

export const pages: ReadonlyArray<IPageDefinition> = [
  PersonalInformationPage,
  DemographicInformationPage,
  EmployerInformationPage,
  SelfEmploymentPage,
  SubmitPage,
] as const;

export type FormPath = `/claim/${typeof pages[number]["path"]}`;
