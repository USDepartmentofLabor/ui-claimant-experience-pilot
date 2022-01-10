import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import isEqual from "lodash/isEqual";
import ClaimFormPage, { ClaimForm } from "./ClaimForm";
import { QueryClient, QueryClientProvider } from "react-query";
import { useWhoAmI } from "../../queries/whoami";
import {
  useGetCompletedClaim,
  useGetPartialClaim,
  useSubmitClaim,
} from "../../queries/claim";
import {
  getInitialValuesFromPageDefinitions,
  initializeClaimFormWithWhoAmI,
  mergeClaimFormValues,
} from "../../utils/claim_form";
import { Route, Routes, MemoryRouter } from "react-router-dom";
import { Routes as ROUTES } from "../../routes";
import { I18nextProvider } from "react-i18next";
import i18n from "../../i18n";
import { pages } from "../PageDefinitions";

const { CLAIM_FORM_PAGE } = ROUTES;

jest.mock("../../queries/whoami");
const mockedUseWhoAmI = useWhoAmI as jest.Mock;

jest.mock("../../queries/claim");
const mockedUseSubmitClaim = useSubmitClaim as jest.Mock;
const mockedUseGetPartialClaim = useGetPartialClaim as jest.Mock;
const mockedUseGetCompletedClaim = useGetCompletedClaim as jest.Mock;

const myPII: WhoAmI = {
  claim_id: "123",
  claimant_id: "321",
  first_name: "Hermione",
  last_name: "Granger",
  birthdate: "2000-01-01",
  ssn: "555-55-5555",
  email: "test@example.com",
  phone: "555-555-5555",
  swa_code: "MD",
  swa_name: "Maryland",
  swa_claimant_url: "https://some-test-url.gov",
};

describe("the ClaimForm page", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mockedUseWhoAmI.mockImplementation(() => ({
      data: myPII,
      isFetched: true,
      error: null,
      isError: false,
      isSuccess: true,
    }));

    mockedUseSubmitClaim.mockImplementation(() => ({
      isFetched: true,
      isError: false,
      mutateAsync: jest.fn(),
      data: { status: 201 },
    }));

    mockedUseGetPartialClaim.mockImplementation(() => ({
      isLoading: false,
      isError: false,
      error: null,
      isSuccess: true,
      data: {},
    }));

    mockedUseGetCompletedClaim.mockImplementation(() => ({
      data: {},
      isFetched: true,
      error: null,
      isError: true,
      isSuccess: false,
    }));
  });
  const queryClient = new QueryClient();
  const Page = (
    <MemoryRouter initialEntries={["/claim/personal-information"]}>
      <I18nextProvider i18n={i18n}>
        <QueryClientProvider client={queryClient}>
          <Routes>
            <Route path={CLAIM_FORM_PAGE} element={<ClaimFormPage />} />
          </Routes>
        </QueryClientProvider>
      </I18nextProvider>
    </MemoryRouter>
  );
  it("renders without error", async () => {
    render(Page);
    expect(await screen.findByRole("heading")).toHaveTextContent("Welcome");
  });

  it("initializes form values", async () => {
    const initialValues: FormValues = await initializeClaimFormWithWhoAmI(
      getInitialValuesFromPageDefinitions(pages),
      myPII
    );
    expect(initialValues.claimant_name).toEqual({
      first_name: myPII.first_name,
      middle_name: "",
      last_name: myPII.last_name,
    });
  });

  it("merges form values with restored partial claim", async () => {
    const initialValues: FormValues = await initializeClaimFormWithWhoAmI(
      getInitialValuesFromPageDefinitions(pages),
      myPII
    );
    const restoredClaim = {
      alternate_names: [{ first_name: "F", last_name: "L" }],
      residence_address: {
        address1: "123 Main St",
        city: "Anywhere",
        state: "KS",
        zipcode: "12345",
      },
      mailing_address: {
        address1: "123 Main St",
        city: "Anywhere",
        state: "KS",
        zipcode: "12345",
      },
      employers: [
        {
          name: "ACME 0",
          last_work_date: "2020-12-12",
          phones: [{ number: "555-555-5555" }, { number: "555-555-1234" }],
          work_site_address: {
            address1: "123 Elsewhere",
            city: "Somewhere",
            state: "KS",
            zipcode: "12345",
          },
        },
        {
          name: "ACME 1",
          phones: [{ number: "555-555-5555" }],
        },
      ],
    };
    expect(
      isEqual(restoredClaim.residence_address, restoredClaim.mailing_address)
    ).toBe(true);
    const mergedValues = await mergeClaimFormValues(
      initialValues,
      restoredClaim
    );
    expect(mergedValues.LOCAL_mailing_address_same).toBe(true);
    expect(mergedValues.LOCAL_claimant_has_alternate_names).toEqual("yes");
    expect(mergedValues.employers[0].LOCAL_same_address).toEqual("no");
    expect(mergedValues.employers[1].LOCAL_same_address).toEqual("yes");
    expect(mergedValues.employers[0].LOCAL_same_phone).toEqual("no");
    expect(mergedValues.employers[1].LOCAL_same_phone).toEqual(undefined);
    expect(mergedValues.LOCAL_more_employers).toEqual(["yes", "no"]);
  });

  it("navigates between first 2 pages", async () => {
    const { getByText, getByLabelText, getByRole, getByTestId } = render(Page);

    const getPersonalInformationFields = () => {
      const residenceAddressGroup = getByRole("group", {
        name: "What is your primary address?",
      });

      return {
        firstName: getByLabelText("First Name"),
        lastName: getByLabelText("Last Name"),
        noAdditionalClaimantNames: getByRole("radio", { name: "No" }),
        residenceAddress1: within(residenceAddressGroup).getByLabelText(
          "Address 1"
        ),
        residenceAddress2: within(residenceAddressGroup).getByLabelText(
          "Address 2"
        ),
        residenceCity: within(residenceAddressGroup).getByLabelText("City"),
        residenceState: within(residenceAddressGroup).getByLabelText("State"),
        residenceZIPCode: within(residenceAddressGroup).getByLabelText(
          "ZIP Code"
        ),
        mailingAddressIsSame: getByTestId("LOCAL_mailing_address_same"),
        nextLink: getByText("Next", { exact: false }),
      };
    };

    const {
      firstName,
      lastName,
      noAdditionalClaimantNames,
      residenceAddress1,
      residenceAddress2,
      residenceCity,
      residenceState,
      residenceZIPCode,
      mailingAddressIsSame,
      nextLink,
    } = getPersonalInformationFields();

    // Fill out personal-information

    await userEvent.type(firstName, myPII.first_name);
    await userEvent.type(lastName, myPII.last_name);
    await userEvent.click(noAdditionalClaimantNames);
    await userEvent.type(residenceAddress1, "address1");
    await userEvent.type(residenceAddress2, "address2");
    await userEvent.type(residenceCity, "city");
    await userEvent.selectOptions(residenceState, ["CA"]);
    await userEvent.type(residenceZIPCode, "00000");
    await userEvent.click(mailingAddressIsSame);

    expect(noAdditionalClaimantNames).toBeChecked();

    await userEvent.click(nextLink);

    await waitFor(() => {
      expect(firstName).not.toBeInTheDocument();
    });

    const getDemographicInformationFields = () => ({
      female: getByRole("radio", { name: "Female" }),
      hispanic: getByRole("radio", { name: "Yes" }),
      white: getByLabelText("White"),
      educationLevelDropdown: getByLabelText(
        "How many years of education have you finished?"
      ),
      backButton: getByText("Previous", { exact: false }),
      nextButton: getByText("Next", { exact: false }),
    });

    const { backButton: backToPersonalInformation } =
      getDemographicInformationFields();

    await userEvent.click(backToPersonalInformation);

    await waitFor(() => {
      const { firstName: firstNameRevisited } = getPersonalInformationFields();
      expect(firstNameRevisited).toBeInTheDocument();
    });

    await userEvent.click(nextLink);

    await waitFor(async () => {
      const { female, hispanic, white, educationLevelDropdown, nextButton } =
        getDemographicInformationFields();

      // Fill out demographic-information

      await userEvent.click(female);
      await userEvent.click(hispanic);
      await userEvent.click(white);
      await userEvent.selectOptions(educationLevelDropdown, "grade_12");
      await userEvent.click(nextButton);
    });

    const getSubmitClaimFields = () => ({
      backButton: getByText("Previous", { exact: false }),
    });

    const { backButton: backToDemographicInformation } = getSubmitClaimFields();

    await userEvent.click(backToDemographicInformation);

    await waitFor(() => {
      const {
        female: femaleRevisited,
        hispanic: hispanicRevisited,
        white: whiteRevisited,
        backButton: gotBackToPersonalInformationAgain,
        nextButton: goToSubmitClaimAgain,
      } = getDemographicInformationFields();
      expect(femaleRevisited).toBeInTheDocument();
      expect(hispanicRevisited).toBeInTheDocument();
      expect(whiteRevisited).toBeInTheDocument();
      expect(gotBackToPersonalInformationAgain).toBeInTheDocument();
      expect(goToSubmitClaimAgain).toBeInTheDocument();
    });
  });
});

describe("the ClaimForm", () => {
  beforeEach(() => {
    jest.spyOn(console, "error");
    (console.error as jest.Mock).mockImplementation(jest.fn());
  });

  afterEach(() => {
    (console.error as jest.Mock).mockRestore();
  });

  const mockMutateAsync = jest.fn();

  beforeEach(() => {
    jest.resetAllMocks();
    mockedUseWhoAmI.mockImplementation(() => ({
      data: myPII,
      isFetched: true,
      error: null,
      isError: false,
    }));

    mockedUseSubmitClaim.mockImplementation(() => ({
      isFetched: true,
      isError: false,
      mutateAsync: mockMutateAsync,
      data: { status: 201 },
    }));

    mockedUseGetPartialClaim.mockImplementation(() => ({
      isLoading: false,
      isError: false,
      error: null,
      isSuccess: true,
      data: {},
    }));

    mockedUseGetCompletedClaim.mockImplementation(() => ({
      data: {},
      isFetched: true,
      error: null,
      isError: true,
      isSuccess: false,
    }));
  });

  const queryClient = new QueryClient();
  const wrappedClaimForm = (
    <MemoryRouter initialEntries={["/claim/personal-information"]}>
      <I18nextProvider i18n={i18n}>
        <QueryClientProvider client={queryClient}>
          <Routes>
            <Route path={CLAIM_FORM_PAGE} element={<ClaimForm />} />
          </Routes>
        </QueryClientProvider>
      </I18nextProvider>
    </MemoryRouter>
  );

  it("renders without error", async () => {
    mockedUseWhoAmI.mockReturnValueOnce({
      data: myPII,
      isFetched: true,
      error: null,
      isError: false,
    });

    mockedUseSubmitClaim.mockReturnValueOnce({
      isIdle: true,
    });

    render(wrappedClaimForm);

    expect(useWhoAmI).toHaveBeenCalled();
    expect(screen.getByText("First Name")).toBeInTheDocument();
  });

  it("shows the loader when loading", () => {
    mockedUseWhoAmI.mockReturnValueOnce({
      isFetched: false,
    });
    render(wrappedClaimForm);
    expect(screen.queryByTestId("page-loading")).toBeInTheDocument();
    expect(screen.queryByTestId("claim-submission")).not.toBeInTheDocument();
  });

  it("throws an error if there is an error returned", () => {
    mockedUseWhoAmI.mockReturnValue({
      isFetched: true,
      error: { message: "Error getting your PII" },
    });

    expect(() => render(wrappedClaimForm)).toThrow("Error getting your PII");
    expect(console.error).toHaveBeenCalled();
    expect((console.error as jest.Mock).mock.calls[0][0]).toContain(
      "Error: Uncaught { message: 'Error getting your PII' }"
    );
  });

  it("renders success message when submitted successfully", () => {
    mockedUseWhoAmI.mockReturnValueOnce({
      data: myPII,
      isError: false,
      error: null,
      isFetched: true,
    });
    mockedUseSubmitClaim.mockReturnValueOnce({
      isSuccess: true,
      data: { status: 201 },
    });
    render(wrappedClaimForm);
    expect(screen.queryByRole("heading", { level: 4 })).toHaveTextContent(
      "Success status"
    );
  });
});

describe("Already Submitted", () => {
  const mockMutateAsync = jest.fn();

  beforeEach(() => {
    jest.resetAllMocks();
    mockedUseWhoAmI.mockImplementation(() => ({
      data: myPII,
      isFetched: true,
      error: null,
      isError: false,
    }));

    mockedUseSubmitClaim.mockImplementation(() => ({
      isFetched: true,
      isError: false,
      mutateAsync: mockMutateAsync,
      data: { status: 201 },
    }));

    mockedUseGetPartialClaim.mockImplementation(() => ({
      isLoading: false,
      isError: false,
      error: null,
      isSuccess: true,
      data: {},
    }));

    mockedUseGetCompletedClaim.mockImplementation(() => ({
      data: { status: 200 },
      isFetched: true,
      error: null,
      isError: false,
      isSuccess: true,
    }));
  });

  const queryClient = new QueryClient();
  const wrappedClaimForm = (
    <MemoryRouter initialEntries={["/claim/personal-information"]}>
      <I18nextProvider i18n={i18n}>
        <QueryClientProvider client={queryClient}>
          <Routes>
            <Route path={CLAIM_FORM_PAGE} element={<ClaimForm />} />
          </Routes>
        </QueryClientProvider>
      </I18nextProvider>
    </MemoryRouter>
  );

  it("informs user that claim has been submitted", async () => {
    render(wrappedClaimForm);
    const warning = await screen.findByText(
      "Sorry, you have a Claim currently being processed",
      { exact: false }
    );
    expect(warning).toBeInTheDocument();
  });
});
