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

type Claim = {
  id?: string;
  swa_code: string;
  claimant_id: string;
};
