type WhoAmI = {
  claim_id?: string;
  claimant_id: string;
  form_id: string;
  first_name: string;
  last_name: string;
  birthdate: string;
  ssn: string;
  email: string;
  phone: string;
  swa_code: string;
};

type ClaimResponse = {
  status: string;
  claim_id: string;
};

type ClaimantInput = {
  first_name?: string | null;
  last_name?: string | null;
  birthdate?: string;
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
