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
  LOCAL_claimant_has_alternate_names?: YesNo;
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
  LOCAL_still_working: YesNo | undefined;
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

type ClaimantInput = PersonalInformationType &
  DemographicInformationType &
  EmployersType & {
    ssn?: string;
    email?: string;
    phone?: string | null;
    is_complete?: boolean;
  };

type Claim = ClaimantInput & {
  id?: string;
  swa_code: string;
  claimant_id: string;
};

type PageProps = {
  segment: string | undefined;
};
