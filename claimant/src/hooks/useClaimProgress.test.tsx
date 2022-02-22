import { render, screen } from "@testing-library/react";
import { pages } from "../pages/PageDefinitions";
import { Routes } from "../routes";
import { useClaimProgress } from "./useClaimProgress";

jest.mock("../queries/claim");
jest.mock("react-i18next", () => ({
  useTranslation: () => {
    return {
      t: (str: string) => str,
    };
  },
}));

const setupComponent = (partialClaimResponse: PartialClaimApiResponseType) => {
  const Component = () => {
    const { continuePath } = useClaimProgress(partialClaimResponse);
    return <>{continuePath}</>;
  };
  render(<Component />);
};

describe("useClaimProgress", () => {
  it("returns first path for unstarted form", () => {
    setupComponent({ status: "ok", claim: {} });
    expect(
      screen.getByText(`${Routes.CLAIM_FORM_HOME}${pages[0].path}`)
    ).toBeInTheDocument();
  });
  it("returns contact page if personal done", () => {
    setupComponent({
      status: "ok",
      claim: {
        claimant_name: { first_name: "Jane", last_name: "Doe" },
        LOCAL_claimant_has_alternate_names: false,
        residence_address: {
          address1: "123 Fake St",
          city: "Fakeville",
          state: "AK",
          zipcode: "12345",
        },
      },
    });
    expect(
      screen.getByText(`${Routes.CLAIM_FORM_HOME}${pages[1].path}`)
    ).toBeInTheDocument();
  });
  it("handles segments correctly", () => {
    setupComponent({ status: "ok", claim: completedUpToEmployerTwo });
    expect(
      screen.getByText(`${Routes.CLAIM_FORM_HOME}employer/1/`)
    ).toBeInTheDocument();
  });
});

const completedUpToEmployerTwo = {
  claimant_name: {
    first_name: "Timothy",
    middle_name: "",
    last_name: "Thompson",
  },
  LOCAL_claimant_has_alternate_names: false,
  alternate_names: [],
  residence_address: {
    address1: "15024 N Scottsdale Ln",
    address2: "",
    city: "Scottsdale",
    state: "AZ",
    zipcode: "38649",
  },
  LOCAL_mailing_address_same: true,
  mailing_address: {
    address1: "15024 N Scottsdale Ln",
    address2: "",
    city: "Scottsdale",
    state: "AZ",
    zipcode: "38649",
  },
  email: "lybezyq@example.com",
  phones: [{ number: "+1 (703) 867-5309", type: "mobile" }],
  interpreter_required: false,
  preferred_language: "sdfs",
  sex: "male",
  ethnicity: "not_hispanic",
  race: ["opt_out"],
  birthdate: "1996-07-22",
  ssn: "455-35-8619",
  work_authorization: {
    authorized_to_work: true,
    authorization_type: "permanent_resident",
    alien_registration_number: "123-456-789",
  },
  state_credential: { drivers_license_or_state_id_number: "AZ", issuer: "AZ" },
  employers: [
    {
      name: "Macrosoft",
      first_work_date: "2004-12-06",
      address: {
        address1: "15024 N Scottsdale Ln",
        address2: "",
        city: "Scottsdale",
        state: "AZ",
        zipcode: "12580",
      },
      work_site_address: {
        state: "AZ",
        address1: "15024 N Scottsdale Ln",
        address2: "Eum esse in tempori",
        city: "Scottsdale",
        zipcode: "89471",
      },
      LOCAL_same_address: true,
      phones: [{ number: "+1 (703) 867-5309" }],
      LOCAL_same_phone: true,
      separation_reason: "quit",
      separation_comment: "Sick",
      fein: "11-1111111",
      separation_option: "health",
      last_work_date: "2022-02-17",
    },
    {
      name: "Goggle",
      first_work_date: "2015-08-03",
      address: {
        address1: "15024 N Scottsdale Ln",
        address2: "",
        city: "",
        state: "AZ",
        zipcode: "51671",
      },
      work_site_address: {
        state: "AZ",
        address1: "15024 N Scottsdale Ln",
        address2: "Ullam provident in ",
        city: "Scottsdale",
        zipcode: "13541",
      },
      LOCAL_same_address: true,
      phones: [{ number: "+1 (703) 867-5309" }],
      LOCAL_same_phone: true,
      separation_reason: "laid_off",
      separation_comment: "It was over",
      fein: "22-2222222",
      separation_option: "finished_job",
      last_work_date: "2022-02-08",
    },
  ],
  LOCAL_more_employers: [true, false],
  is_complete: false,
  swa_code: "AR",
};
