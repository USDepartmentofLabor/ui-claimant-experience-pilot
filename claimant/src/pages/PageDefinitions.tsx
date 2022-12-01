import { AnySchema } from "yup";
import { TFunction } from "react-i18next";
import { PersonalInformationPage } from "./Questions/PersonalInformation/PersonalInformation";
import { DemographicPage } from "./Questions/Demographic/Demographic";
import { EmployerInformationPage } from "./Questions/EmployerInformation/EmployerInformation";
import { EmployerReviewPage } from "./Questions/EmployerReview/EmployerReview";
import { OccupationPage } from "./Questions/Occupation/Occupation";
import { UnionPage } from "./Questions/Union/Union";
import { ReviewPage } from "./Questions/Review/Review";
import { FC } from "react";
import { DUASelfEmploymentPage } from "./Questions/DUASelfEmployment/DUASelfEmployment";
// import { SelfEmploymentPage } from "./Questions/SelfEmployment/SelfEmployment";
import { EducationVocationalRehabPage } from "./Questions/EducationVocationalRehab/EducationVocationalRehab";
import { DisabilityStatusPage } from "./Questions/DisabilityStatus/DisabilityStatus";
import { ContactInformationPage } from "./Questions/ContactInformation/ContactInformation";
import en from "../i18n/en";
import { AvailabilityPage } from "./Questions/Availability/Availability";
import { PaymentInformationPage } from "./Questions/PaymentInformation/PaymentInformation";
import { IdentityPage } from "./Questions/Identity/Identity";
import { OtherPayInformationPage } from "./Questions/OtherPayInformation/OtherPayInformation";

export interface IPreviousSegment {
  segment?: string;
  values?: ClaimantInput;
}

export interface IPageDefinition {
  path: string;
  heading: keyof typeof en.common.page_headings;
  initialValues: FormValues;
  Component: FC<PageProps>;
  repeatable?: (
    currentSegment: string | undefined,
    values: FormValues
  ) => boolean;
  nextSegment?: (currentSegment: string | undefined) => string | false;
  previousSegment?: (
    currentSegmentOrValues: IPreviousSegment
  ) => string | false;
  pageSchema: (t: TFunction<"claimForm">) => AnySchema;
  segmentSchema?: (
    t: TFunction<"claimForm">,
    currentSegment: string | undefined
  ) => AnySchema;
}

export const pages: ReadonlyArray<IPageDefinition> = [
  PersonalInformationPage,
  ContactInformationPage,
  DemographicPage,
  IdentityPage,
  DUASelfEmploymentPage,
  EmployerInformationPage,
  EmployerReviewPage,
  // SelfEmploymentPage,
  OtherPayInformationPage,
  OccupationPage,
  EducationVocationalRehabPage,
  UnionPage,
  DisabilityStatusPage,
  AvailabilityPage,
  PaymentInformationPage,
  ReviewPage,
] as const;

export type FormPath = `/claim/${typeof pages[number]["path"]}`;
