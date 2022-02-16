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

type Claim = ClaimantInput & {
  id?: string;
  swa_code: string;
  claimant_id: string;
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
  swa_code: string;
  swa_name: string;
  swa_claimant_url: string;
  address?: AddressType;
};

type FormValues = {
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  [key: string]: any;
};

type ApiResponse = {
  status: string;
  error?: string;
};

type ClaimResponse = ApiResponse & {
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
  type?: string;
};

type YesNo = "yes" | "no";

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

type DemographicInformationType = {
  sex?: string;
  ethnicity?: string[];
  race?: string[];
};

type WorkAuthorizationType = {
  work_authorization?: {
    authorized_to_work?: boolean;
    not_authorized_to_work_explanation?: string;
    authorization_type?: string;
    alien_registration_number?: string;
  };
};

type StateCredentialType = {
  state_credential?: {
    drivers_license_or_state_id_number?: string;
    issuer?: string;
  };
};

type EmployerType = {
  name: string;
  days_employed?: number;
  LOCAL_same_address?: boolean;
  LOCAL_same_phone?: boolean;
  first_work_date: string;
  last_work_date?: string;
  recall_date?: string;
  fein?: string;
  address: AddressType;
  work_site_address?: AddressType;
  phones: PhoneType[];
  separation_reason: string;
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
    payment_method: string;
    account_type: string;
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
    ownership_in_business: YesNo;
    name_of_business: string | null;
    is_corporate_officer: YesNo;
    name_of_corporation: string | null;
    related_to_owner: YesNo;
    corporation_or_partnership: YesNo;
  };
}>;

type OtherPayType = Partial<{
  LOCAL_pay_types: string[];
  other_pay: OtherPayDetailType[];
}>;

type OtherPayDetailType = {
  pay_type: string;
  total?: number;
  date_received?: string;
  note?: string;
};

type DisabilityStatusType = DeepPartial<{
  disability: {
    has_collected_disability: boolean;
    disabled_immediately_before: boolean;
    type_of_disability: string;
    date_disability_began: string;
    recovery_date: string;
    contacted_last_employer_after_recovery: boolean;
  };
}>;

type EducationVocationalRehabType = Partial<{
  student_fulltime_in_last_18_months: boolean;
  attending_college_or_job_training: boolean;
  registered_with_vocational_rehab: boolean;
  education_level?: string;
}>;

type CompleteClaimType = {
  is_complete?: boolean;
};

type DeepPartial<T> = {
  [P in keyof T]?: DeepPartial<T[P]>;
};
