import { render, screen } from "@testing-library/react";
import { Formik } from "formik";
import { EmployerReview, EmployerReviewPage } from "./EmployerReview";
import { noop } from "../../../testUtils/noop";
import { useWhoAmI } from "../../../queries/whoami";
import { ComponentProps } from "react";
import { Trans } from "react-i18next";
import { QueryClient, QueryClientProvider } from "react-query";
import { MemoryRouter } from "react-router-dom";

jest.mock("react-i18next", () => ({
  useTranslation: () => {
    return {
      t: (str: string) => str,
    };
  },
  Trans: ({ children }: ComponentProps<typeof Trans>) => <>{children}</>,
}));

jest.mock("../../../queries/whoami");
const mockedUseWhoAmI = useWhoAmI as any;

const claim = {
  LOCAL_more_employers: [true, false],
  employers: [
    {
      name: "Recent employer 1",
      address: {
        address1: "123 Fake St",
        address2: "Apt 3",
        city: "Fakeville",
        state: "NJ",
        zipcode: "12356",
      },
      LOCAL_same_address: false,
      work_site_address: {
        address1: "Fortress",
        address2: "Of Solitude",
        city: "Nowhere",
        state: "AK",
        zipcode: "99999",
      },
      phones: [{ number: "1234567890" }, { number: "0987654321" }],
      LOCAL_same_phone: false,
      fein: "12345",
      separation_reason: "laid_off" as SeparationReasonOptionType,
      separation_option: "lack_of_work",
      separation_comment: "I got laid off :(",
      first_work_date: "2020-01-01",
      last_work_date: "2020-12-31",
    },
    {
      name: "Recent employer 2",
      address: {
        address1: "123 Fake St",
        address2: "Apt 3",
        city: "Fakeville",
        state: "NJ",
        zipcode: "12356",
      },
      LOCAL_same_address: false,
      work_site_address: {
        address1: "Fortress",
        address2: "Of Solitude",
        city: "Nowhere",
        state: "AK",
        zipcode: "99999",
      },
      phones: [{ number: "1234567890" }, { number: "0987654321" }],
      LOCAL_same_phone: false,
      fein: "12345",
      separation_reason: "laid_off" as SeparationReasonOptionType,
      separation_option: "lack_of_work",
      separation_comment: "I got laid off :(",
      first_work_date: "2020-01-01",
      last_work_date: "2020-12-31",
    },
  ],
};

const myPII: WhoAmI = {
  IAL: "2",
  claim_id: "123",
  claimant_id: "321",
  first_name: "Hermione",
  last_name: "Granger",
  birthdate: "2000-01-01",
  ssn: "555-55-5555",
  email: "test@example.com",
  phone: "555-555-5555",
  swa: {
    code: "MD",
    name: "Maryland",
    claimant_url: "https://some-test-url.gov",
    featureset: "Claim And Identity",
  },
  address: {
    address1: "123 Main St",
    city: "Anywhere",
    state: "KS",
    zipcode: "00000",
  },
  identity_provider: "Local",
};

mockedUseWhoAmI.mockReturnValueOnce({
  data: myPII,
  isFetched: true,
  error: null,
  isError: false,
});

describe("EmployerReview Page", () => {
  it("renders properly", () => {
    const queryClient = new QueryClient();
    render(
      <MemoryRouter>
        <QueryClientProvider client={queryClient}>
          <Formik initialValues={claim} onSubmit={noop}>
            <EmployerReview />
          </Formik>
        </QueryClientProvider>
      </MemoryRouter>
    );

    const employerOne = screen
      .getAllByText("Recent employer 1")[0]
      .closest("div");
    const employerTwo = screen
      .getAllByText("Recent employer 2")[0]
      .closest("div");
    expect(employerOne).not.toBeNull();
    expect(employerTwo).not.toBeNull();
  });

  it("paginates based on segment", () => {
    if (EmployerReviewPage.previousSegment) {
      expect(EmployerReviewPage.previousSegment({})).toEqual("/claim/employer");
      expect(EmployerReviewPage.previousSegment({ values: claim })).toEqual(
        "/claim/employer/1"
      );
    } else {
      throw new Error("Employer previousSegment is not defined");
    }
  });
});
