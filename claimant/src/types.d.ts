type ClaimantInput = PersonalInformationType &
  ContactType &
  DemographicInformationType &
  PaymentInformationType &
  EmployersType &
  SelfEmploymentType &
  DisabilityStatusType &
  AvailabilityType &
  EducationVocationalRehabType & { union?: UnionType } & {
    occupation?: OccupationType;
  } & SelfEmploymentType & {
    is_complete?: boolean;
  };

type Claim = ClaimantInput & {
  id?: string;
  swa_code: string;
  claimant_id: string;
};

type WhoAmI = {
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

type StateType = {
  value: string;
  label: string;
};

type ClaimantNamesType = {
  claimant_name?: PersonName;
  LOCAL_claimant_has_alternate_names?: boolean;
  alternate_names?: PersonName[];
};

type ClaimantAddressType = {
  residence_address?: AddressType;
  mailing_address?: AddressType;
};

type PersonalInformationType = ClaimantNamesType & ClaimantAddressType;

type DemographicInformationType = {
  birthdate?: string;
  sex?: string;
  ethnicity?: string[];
  race?: string[];
  education_level?: string;
};

type EmployerType = {
  name: string;
  days_employed?: number;
  LOCAL_same_address: YesNo | undefined;
  LOCAL_same_phone: YesNo | undefined;
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
  LOCAL_more_employers?: YesNo[];
};

type OccupationType = {
  job_title: string;
  job_description: string;
  bls_code: string;
  bls_title: string;
  bls_description: string;
};

type UnionType = {
  is_union_member?: boolean;
  union_name?: string;
  union_local_number?: string;
  required_to_seek_work_through_hiring_hall?: boolean;
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
}>;

type DeepPartial<T> = {
  [P in keyof T]?: DeepPartial<T[P]>;
};
