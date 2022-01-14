import { AnySchema } from "yup";
import { TFunction } from "react-i18next";
import { PersonalInformationPage } from "./Questions/PersonalInformation/PersonalInformation";
import { DemographicInformationPage } from "./Questions/DemographicInformation/DemographicInformation";
import { EmployerInformationPage } from "./Questions/EmployerInformation/EmployerInformation";
import { OccupationPage } from "./Questions/Occupation/Occupation";
import { UnionPage } from "./Questions/Union/Union";
import { SubmitPage } from "./Questions/Submit/Submit";
import { ClaimSchemaField } from "../common/YupBuilder";
import { FC } from "react";
import { SelfEmploymentPage } from "./Questions/SelfEmployment/SelfEmployment";
import { EducationVocationalRehabPage } from "./Questions/EducationVocationalRehab/EducationVocationalRehab";
import { DisabilityStatusPage } from "./Questions/DisabilityStatus/DisabilityStatus";
import { ContactInformationPage } from "./Questions/ContactInformation/ContactInformation";
import en from "../i18n/en";
import { AvailabilityPage } from "./Questions/Availability/Availability";

export interface IPageDefinition {
  path: string;
  heading: keyof typeof en.common.page_headings;
  schemaFields: ClaimSchemaField[];
  initialValues: FormValues;
  Component: FC<PageProps>;
  repeatable?: (
    currentSegment: string | undefined,
    values: FormValues
  ) => boolean;
  nextSegment?: (currentSegment: string | undefined) => string | false;
  previousSegment?: (currentSegment: string | undefined) => string | false;
  pageSchema?: (t: TFunction<"claimForm">) => AnySchema;
}

export const pages: ReadonlyArray<IPageDefinition> = [
  PersonalInformationPage,
  ContactInformationPage,
  DemographicInformationPage,
  EmployerInformationPage,
  SelfEmploymentPage,
  OccupationPage,
  EducationVocationalRehabPage,
  UnionPage,
  DisabilityStatusPage,
  AvailabilityPage,
  SubmitPage,
] as const;

export type FormPath = `/claim/${typeof pages[number]["path"]}`;
