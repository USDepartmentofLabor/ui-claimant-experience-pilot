type ClaimantInput = {
  ssn?: string;
  birthdate?: string;
} & PersonalInformationType &
  ContactType &
  DemographicInformationType &
  WorkAuthorizationType &
  StateCredentialType &
  PaymentInformationType &
  EmployersType &
  SelfEmploymentType &
  OtherPayType &
  DisabilityStatusType &
  AvailabilityType &
  EducationVocationalRehabType &
  UnionType &
  OccupationType &
  CompleteClaimType;

type IdentityClaimType = {
  id?: string;
  swa_code: string;
  claimant_id: string;
};

type Claim = ClaimantInput & IdentityClaimType;

type ValidationError = {
  string: {
    path: string;
    invalid: string;
    message: string;
    context: string;
    cause: string;
  };
};

type PartialClaimApiResponseType = ApiResponseType & {
  expires?: string;
  remaining_time?: string;
  claim?: Partial<Claim>;
  validation_errors?: ValidationError[];
};

// ClaimantClaim is the metadata from /api/claims/
type ClaimantClaim = {
  id: string;
  created_at: string;
  updated_at: string;
  status: string;
  swa: { code: string; name: string; claimant_url: string };
  completed_at: string | null;
  deleted_at: string | null;
  fetched_at: string | null;
  resolved_at: string | null;
  resolution: string | null;
};

type ApiClaimsResponse = {
  claims: ClaimantClaim[];
};

type SWAType = {
  code: string;
  name: string;
  claimant_url: string;
  featureset: "Claim And Identity" | "Claim Only" | "Identity Only";
};

type WhoAmI = {
  IAL?: "1" | "2";
  claim_id?: string;
  claimant_id: string;
  first_name: string;
  last_name: string;
  birthdate: string;
  ssn: string;
  email: string;
  phone: string;
  swa: SWAType;
  address?: AddressType;
  identity_provider: "login.gov" | "Local";
  verified_at?: string;
};

type FormValues = {
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  [key: string]: any;
};

type ApiResponseType = {
  status: string;
  error?: string;
};

type ClaimResponseType = ApiResponseType & {
  claim_id?: string;
};

type PersonName = {
  first_name: string;
  middle_name?: string;
  last_name: string;
};

type AddressType = {
  address1: string;
  address2?: string;
  city: string;
  state: string;
  zipcode: string;
};

type PhoneType = {
  number: string;
  sms?: boolean;
  type?: "home" | "work" | "mobile";
};

type ClaimantNamesType = {
  claimant_name?: PersonName;
  LOCAL_claimant_has_alternate_names?: boolean;
  alternate_names?: PersonName[];
};

type ClaimantAddressType = {
  residence_address?: AddressType;
  mailing_address?: AddressType;
  LOCAL_mailing_address_same?: boolean;
};

type PersonalInformationType = ClaimantNamesType & ClaimantAddressType;

type SexOptionType = "female" | "male";

type EthnicityOptionType = "hispanic" | "not_hispanic" | "opt_out";

type RaceOptionType =
  | "american_indian_or_alaskan"
  | "asian"
  | "black"
  | "hawaiian_or_pacific_islander"
  | "white"
  | "opt_out";

type DemographicInformationType = {
  sex?: SexOptionType;
  ethnicity?: EthnicityOptionType;
  race?: RaceOptionType[];
};

type AuthorizationTypeOptionType =
  | "US_citizen_or_national"
  | "permanent_resident"
  | "temporary_legal_worker";

type WorkAuthorizationType = {
  work_authorization?: {
    authorized_to_work?: boolean;
    not_authorized_to_work_explanation?: string;
    authorization_type?: AuthorizationTypeOptionType;
    alien_registration_number?: string;
  };
};

type StateCredentialType = {
  state_credential?: {
    drivers_license_or_state_id_number?: string;
    issuer?: string;
  };
};

type SeparationReasonOptionType =
  | "laid_off"
  | "fired_discharged_terminated"
  | "still_employed"
  | "quit"
  | "strike"
  | "retired"
  | "shutdown";

type EmployerType = {
  name: string;
  days_employed?: number;
  LOCAL_same_address?: boolean;
  LOCAL_same_phone?: boolean;
  first_work_date: string;
  last_work_date?: string;
  recall_date?: string;
  fein?: string;
  state_employer_payroll_number?: string;
  self_employed?: boolean;
  address: AddressType;
  work_site_address?: AddressType;
  phones: PhoneType[];
  separation_reason?: SeparationReasonOptionType;
  separation_option?: string;
  separation_comment: string;
};

type EmployersType = {
  employers?: EmployerType[];
  LOCAL_more_employers?: boolean[];
};

type OccupationType = {
  occupation?: {
    job_title: string;
    job_description: string;
    bls_code: string;
    bls_title: string;
    bls_description: string;
  };
};

type UnionType = {
  union?: {
    is_union_member?: boolean;
    union_name?: string;
    union_local_number?: string;
    required_to_seek_work_through_hiring_hall?: boolean;
  };
};

type ContactType = {
  email?: string; // populated from whoami but optional until then.
  phones?: PhoneType[];
  interpreter_required?: boolean;
  preferred_language?: string;
  LOCAL_more_phones?: boolean;
};

type AvailabilityType = {
  availability?: {
    can_begin_work_immediately?: boolean;
    cannot_begin_work_immediately_reason?: string;
    can_work_full_time?: boolean;
    cannot_work_full_time_reason?: string;
    is_prevented_from_accepting_full_time_work?: boolean;
    is_prevented_from_accepting_full_time_work_reason?: string;
  };
};

type PaymentInformationType = DeepPartial<{
  federal_income_tax_withheld: boolean;
  payment: {
    payment_method: "debit" | "direct_deposit";
    account_type: "checking" | "savings";
    routing_number: string;
    LOCAL_re_enter_routing_number: string;
    account_number: string;
    LOCAL_re_enter_account_number: string;
  };
}>;

type PageProps = {
  segment: string | undefined;
};

type SelfEmploymentType = DeepPartial<{
  self_employment: {
    is_self_employed: boolean;
    ownership_in_business: boolean;
    name_of_business: string | null;
    is_corporate_officer: boolean;
    name_of_corporation: string | null;
    related_to_owner: boolean;
    corporation_or_partnership: boolean;
  };
}>;

type OtherPayOptionType =
  | "paid_time_off"
  | "pension_annuity_retirement"
  | "severance"
  | "vacation"
  | "sick"
  | "profit_sharing"
  | "other"
  | "no_other_pay";

type OtherPayType = Partial<{
  LOCAL_pay_types: OtherPayOptionType[];
  other_pay: OtherPayDetailType[];
}>;

type OtherPayDetailType = {
  pay_type: OtherPayOptionType;
  total?: number | string;
  date_received?: string;
  note?: string;
};

type DisabilityStatusType = DeepPartial<{
  disability: {
    has_collected_disability: boolean;
    disabled_immediately_before: boolean;
    type_of_disability: "state_plan" | "private_plan" | "workers_compensation";
    date_disability_began: string;
    recovery_date: string;
    contacted_last_employer_after_recovery: boolean;
  };
}>;

type EducationLevelOptionType =
  | "none"
  | "primary_school"
  | "some_high_school"
  | "high_school_ged"
  | "technical_associates"
  | "bachelors"
  | "masters"
  | "doctorate"
  | "other";

type EducationVocationalRehabType = Partial<{
  attending_college_or_job_training: boolean;
  type_of_college_or_job_training:
    | "part_time_student_outside_working_hours"
    | "part_time_student_during_working_hours"
    | "part_time_student_online_classes_only"
    | "full_time_student";
  registered_with_vocational_rehab: boolean;
  education_level?: EducationLevelOptionType;
}>;

type CompleteClaimType = {
  is_complete?: boolean;
  legal_affirmation?: boolean;
};

type DeepPartial<T> = {
  [P in keyof T]?: DeepPartial<T[P]>;
};
