import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ClaimFormPage, { ClaimForm } from "./ClaimForm";
import { QueryClient, QueryClientProvider } from "react-query";
import { useWhoAmI } from "../../queries/whoami";
import { useGetCompletedClaim, useSubmitClaim } from "../../queries/claim";
import { initializeClaimFormWithWhoAmI } from "../../utils/claim_form";
import { Route, Routes, MemoryRouter } from "react-router-dom";
import { Routes as ROUTES } from "../../routes";
import { I18nextProvider } from "react-i18next";
import i18n from "../../i18n";

const { CLAIM_FORM_PAGE } = ROUTES;

jest.mock("../../queries/whoami");
const mockedUseWhoAmI = useWhoAmI as jest.Mock;

jest.mock("../../queries/claim");
const mockedUseSubmitClaim = useSubmitClaim as jest.Mock;
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
      isLoading: false,
      error: null,
      isError: false,
      isSuccess: true,
    }));

    mockedUseSubmitClaim.mockImplementation(() => ({
      isLoading: false,
      isError: false,
      mutateAsync: jest.fn(),
      data: { status: 201 },
    }));

    mockedUseGetCompletedClaim.mockImplementation(() => ({
      data: {},
      isLoading: false,
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
      myPII
    );
    expect(initialValues.claimant_name).toEqual({
      first_name: myPII.first_name,
      middle_name: "",
      last_name: myPII.last_name,
    });
  });

  it("navigates between pages", async () => {
    const result = render(Page);
    const nextLink = result.getByText("Next", { exact: false });
    // /personal-information
    const moreClaimantNames = result.getByRole("radio", { name: "No" });
    expect(moreClaimantNames).not.toBeChecked();
    await act(async () => {
      userEvent.type(result.getByLabelText("First Name"), myPII.first_name);
      userEvent.type(result.getByLabelText("Last Name"), myPII.last_name);
      userEvent.click(moreClaimantNames);
    });
    expect(moreClaimantNames).toBeChecked();

    const residenceAddress = result.getByRole("group", {
      name: "What is your primary address?",
    });
    const residenceAddress1 =
      within(residenceAddress).getByLabelText("Address 1");
    const residenceAddress2 =
      within(residenceAddress).getByLabelText("Address 2");
    const residenceCity = within(residenceAddress).getByLabelText("City");
    const residenceState = within(residenceAddress).getByLabelText("State");
    const residenceZIPCode =
      within(residenceAddress).getByLabelText("ZIP Code");
    await act(async () => {
      userEvent.type(residenceAddress1, "address1");
      userEvent.type(residenceAddress2, "address2");
      userEvent.type(residenceCity, "city");
      userEvent.selectOptions(residenceState, ["CA"]);
      userEvent.type(residenceZIPCode, "00000");
      userEvent.click(result.getByTestId("LOCAL_mailing_address_same"));
    });

    await act(async () => {
      userEvent.click(nextLink);
    });
    expect(result.getByText("Test Claim")).toBeInTheDocument();
    const backLink = result.getByText("Previous", { exact: false });
    userEvent.click(backLink);
    expect(result.getByText("First Name")).toBeInTheDocument();
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
      isLoading: false,
      error: null,
      isError: false,
    }));

    mockedUseSubmitClaim.mockImplementation(() => ({
      isLoading: false,
      isError: false,
      mutateAsync: mockMutateAsync,
      data: { status: 201 },
    }));

    mockedUseGetCompletedClaim.mockImplementation(() => ({
      data: {},
      isLoading: false,
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
      isLoading: false,
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
      isLoading: true,
    });
    render(wrappedClaimForm);
    expect(screen.queryByTestId("page-loading")).toBeInTheDocument();
    expect(screen.queryByTestId("claim-submission")).not.toBeInTheDocument();
  });

  it("throws an error if there is an error returned", () => {
    mockedUseWhoAmI.mockReturnValue({
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
      isLoading: false,
      error: null,
      isError: false,
    }));

    mockedUseSubmitClaim.mockImplementation(() => ({
      isLoading: false,
      isError: false,
      mutateAsync: mockMutateAsync,
      data: { status: 201 },
    }));

    mockedUseGetCompletedClaim.mockImplementation(() => ({
      data: { status: 200 },
      isLoading: false,
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
