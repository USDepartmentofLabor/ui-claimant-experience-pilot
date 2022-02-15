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
import common from "../../i18n/en/common";

const { CLAIM_FORM_PAGE } = ROUTES;

jest.mock("../../queries/whoami");
const mockedUseWhoAmI = useWhoAmI as any; // jest.MockedFunction<typeof useWhoAmI>;

jest.mock("../../queries/claim");
const mockedUseSubmitClaim = useSubmitClaim as jest.Mock;
const mockedUseGetPartialClaim = useGetPartialClaim as jest.Mock;
const mockedUseGetCompletedClaim = useGetCompletedClaim as jest.Mock;

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
  swa_code: "MD",
  swa_name: "Maryland",
  swa_claimant_url: "https://some-test-url.gov",
  address: {
    address1: "123 Main St",
    city: "Anywhere",
    state: "KS",
    zipcode: "00000",
  },
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
  const Page = ({ route }: { route?: string }) => (
    <MemoryRouter initialEntries={[`/claim/${route || "personal"}`]}>
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
    render(<Page />);
    expect(await screen.findByRole("heading", { level: 1 })).toHaveTextContent(
      "Personal"
    );
  });

  const currentIndicatorStyle = "usa-step-indicator__segment--current";
  const completeIndicatorStyle = "usa-step-indicator__segment--complete";

  it("shows initial progress bar state", async () => {
    render(<Page />);
    const [first] = pages;
    // First li to be current, everything else incomplete
    const progressBar = screen.getByRole("list");
    const barItems = within(progressBar).getAllByRole("listitem");
    barItems.forEach((item) => {
      if (item.textContent?.includes(common.page_headings[first.heading])) {
        expect(item.classList.contains(currentIndicatorStyle)).toBe(true);
      } else {
        expect(
          item.classList.contains(currentIndicatorStyle) ||
            item.classList.contains(completeIndicatorStyle)
        ).toBe(false);
      }
    });
  });

  it("shows later page progress bar state", async () => {
    const [first, second] = pages;
    render(<Page route={second.path} />);
    // First page complete, second current, everything else incomplete
    const progressBar = screen.getByRole("list");
    const barItems = within(progressBar).getAllByRole("listitem");
    barItems.forEach((item) => {
      if (item.textContent?.includes(common.page_headings[first.heading])) {
        expect(item.classList.contains(completeIndicatorStyle)).toBe(true);
      } else if (
        item.textContent?.includes(common.page_headings[second.heading])
      ) {
        expect(item.classList.contains(currentIndicatorStyle)).toBe(true);
      } else {
        expect(
          item.classList.contains(currentIndicatorStyle) ||
            item.classList.contains(completeIndicatorStyle)
        ).toBe(false);
      }
    });
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
    expect(initialValues.residence_address).toEqual({
      address1: "123 Main St",
      city: "Anywhere",
      state: "KS",
      zipcode: "00000",
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
    expect(mergedValues.LOCAL_claimant_has_alternate_names).toEqual(true);
    expect(mergedValues.employers[0].LOCAL_same_address).toEqual(false);
    expect(mergedValues.employers[1].LOCAL_same_address).toEqual(true);
    expect(mergedValues.employers[0].LOCAL_same_phone).toEqual(false);
    expect(mergedValues.employers[1].LOCAL_same_phone).toEqual(undefined);
    expect(mergedValues.LOCAL_more_employers).toEqual([true, false]);
  });

  it("navigates between first 2 pages", async () => {
    render(<Page />);

    const getPersonalInformationFields = () => {
      const residenceAddressGroup = screen.getByRole("group", {
        name: "What is your primary address?",
      });

      return {
        firstName: screen.getByLabelText("First Name"),
        lastName: screen.getByLabelText("Last Name"),
        noAdditionalClaimantNames: screen.getByRole("radio", { name: "No" }),
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
        mailingAddressIsSame: screen.getByTestId("LOCAL_mailing_address_same"),
        nextLink: screen.getByText("Next", { exact: false }),
      };
    };

    const getContactInformationFields = () => ({
      phoneOne: screen.getByTestId("phones[0].number"),
      phoneOneType: screen.getByTestId("phones[0].type"),
      needsInterpreterNo: screen.getByTestId("interpreter_required.no"),
      backButton: screen.getByText("Back", { exact: false }),
      nextButton: screen.getByText("Next", { exact: false }),
    });

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

    // Fill out personal
    await waitFor(() => {
      [
        firstName,
        lastName,
        residenceAddress1,
        residenceCity,
        residenceZIPCode,
      ].forEach((el) => {
        // clear to re-enter text
        userEvent.clear(el);
      });
    });
    userEvent.type(firstName, myPII.first_name);
    userEvent.type(lastName, myPII.last_name);
    userEvent.click(noAdditionalClaimantNames);
    userEvent.type(residenceAddress1, "address1");
    userEvent.type(residenceAddress2, "address2");
    userEvent.type(residenceCity, "city");
    userEvent.selectOptions(residenceState, ["CA"]);
    userEvent.type(residenceZIPCode, "00000");
    userEvent.click(mailingAddressIsSame);

    await waitFor(() => {
      expect(noAdditionalClaimantNames).toBeChecked();
    });

    userEvent.click(nextLink);

    await waitFor(() => {
      expect(firstName).not.toBeInTheDocument();
    });

    const { backButton: backToPersonalInformation } =
      getContactInformationFields();

    userEvent.click(backToPersonalInformation);

    await waitFor(() => {
      const { firstName: firstNameRevisited } = getPersonalInformationFields();
      expect(firstNameRevisited).toBeInTheDocument();
    });

    userEvent.click(nextLink);

    await waitFor(() => {
      expect(firstName).not.toBeInTheDocument();
    });

    const { phoneOne, phoneOneType, needsInterpreterNo, nextButton } =
      getContactInformationFields();

    userEvent.type(phoneOne, "555-555-1234");
    userEvent.selectOptions(phoneOneType, ["mobile"]);
    userEvent.click(needsInterpreterNo);
    userEvent.click(nextButton);

    await waitFor(() => {
      expect(phoneOne).not.toBeInTheDocument();
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
    <MemoryRouter initialEntries={["/claim/personal"]}>
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
