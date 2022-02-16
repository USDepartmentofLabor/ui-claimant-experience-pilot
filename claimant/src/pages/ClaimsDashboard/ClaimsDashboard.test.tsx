import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ClaimsDashboardPage from "./ClaimsDashboard";
import { QueryClient, QueryClientProvider } from "react-query";
import { useWhoAmI } from "../../queries/whoami";
import { useClaims, useCancelClaim } from "../../queries/claims";
import { Route, Routes, MemoryRouter } from "react-router-dom";
import { Routes as ROUTES } from "../../routes";
import { I18nextProvider } from "react-i18next";
import i18n from "../../i18n";
import { useFeatureFlags } from "../FlagsWrapper/FlagsWrapper";

const { CLAIMS_PAGE } = ROUTES;

jest.mock("../../queries/whoami");
const mockedUseWhoAmI = useWhoAmI as any;

jest.mock("../../queries/claims");
const mockedUseClaims = useClaims as jest.Mock;
const mockedUseCancelClaim = useCancelClaim as jest.Mock;

jest.mock("../FlagsWrapper/FlagsWrapper");
const mockUseFeatureFlags = useFeatureFlags as jest.Mock;

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

const myClaims: ClaimantClaim[] = [
  {
    id: "resolved-id",
    created_at: "2022-02-11 18:46:29.143254+00:00",
    updated_at: "2022-02-12 13:56:10.363806+00:00",
    status: "resolved",
    swa: {
      code: "XX",
      name: "Test",
      claimant_url: "https://xx.example.gov/",
    },
    completed_at: "2022-02-12T13:56:10.172Z",
    deleted_at: null,
    fetched_at: "2022-02-12T16:07:11.643Z",
    resolved_at: "2022-02-12T16:05:39.865Z",
    resolution: "i am resolved",
  },
  {
    id: "inprocess-id",
    created_at: "2022-02-11 18:46:29.143254+00:00",
    updated_at: "2022-02-12 13:56:10.363806+00:00",
    status: "in_process",
    swa: {
      code: "XX",
      name: "Test",
      claimant_url: "https://xx.example.gov/",
    },
    completed_at: null,
    deleted_at: null,
    fetched_at: null,
    resolved_at: null,
    resolution: null,
  },
  {
    id: "cancelled-id",
    created_at: "2022-02-11 18:46:29.143254+00:00",
    updated_at: "2022-02-12 13:56:10.363806+00:00",
    status: "cancelled",
    swa: {
      code: "XX",
      name: "Test",
      claimant_url: "https://xx.example.gov/",
    },
    completed_at: "2022-02-12T13:56:10.172Z",
    deleted_at: "2022-02-12T16:07:11.643Z",
    fetched_at: null,
    resolved_at: "2022-02-12T16:05:39.865Z",
    resolution: "i am resolved",
  },
  {
    id: "processing-id",
    created_at: "2022-02-11 18:46:29.143254+00:00",
    updated_at: "2022-02-12 13:56:10.363806+00:00",
    status: "processing",
    swa: {
      code: "XX",
      name: "Test",
      claimant_url: "https://xx.example.gov/",
    },
    completed_at: "2022-02-12T13:56:10.172Z",
    deleted_at: null,
    fetched_at: null,
    resolved_at: null,
    resolution: null,
  },
  {
    id: "active-id",
    created_at: "2022-02-11 18:46:29.143254+00:00",
    updated_at: "2022-02-12 13:56:10.363806+00:00",
    status: "active",
    swa: {
      code: "XX",
      name: "Test",
      claimant_url: "https://xx.example.gov/",
    },
    completed_at: "2022-02-12T13:56:10.172Z",
    deleted_at: null,
    fetched_at: "2022-02-12T13:56:10.172Z",
    resolved_at: null,
    resolution: null,
  },
  {
    id: "deleted-id",
    created_at: "2022-02-11 18:46:29.143254+00:00",
    updated_at: "2022-02-12 13:56:10.363806+00:00",
    status: "deleted",
    swa: {
      code: "XX",
      name: "Test",
      claimant_url: "https://xx.example.gov/",
    },
    completed_at: null,
    deleted_at: "2022-02-12T13:56:59.172Z",
    fetched_at: null,
    resolved_at: null,
    resolution: null,
  },
  {
    id: "unknown-id",
    created_at: "2022-02-11 18:46:29.143254+00:00",
    updated_at: "2022-02-12 13:56:10.363806+00:00",
    status: "unknown",
    swa: {
      code: "XX",
      name: "Test",
      claimant_url: "https://xx.example.gov/",
    },
    completed_at: null,
    deleted_at: null,
    fetched_at: "2022-02-12T13:56:10.172Z",
    resolved_at: null,
    resolution: null,
  },
];

describe("the ClaimsDashboard page", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mockedUseWhoAmI.mockImplementation(() => ({
      data: myPII,
      isFetched: true,
      error: null,
      isError: false,
      isSuccess: true,
    }));

    mockedUseClaims.mockImplementation(() => ({
      isFetched: true,
      isError: false,
      error: null,
      isSuccess: true,
      refetch: jest.fn(),
      data: { claims: myClaims },
    }));

    mockedUseCancelClaim.mockImplementation(() => ({
      data: { status: "ok" },
      isFetched: true,
      mutateAsync: jest.fn(),
      error: null,
      isError: false,
      isSuccess: true,
    }));

    mockUseFeatureFlags.mockImplementation(() => ({
      showClaimsDashboard: true,
      allowClaimResolution: true,
    }));
  });
  const queryClient = new QueryClient();
  const Page = () => (
    <MemoryRouter initialEntries={["/claims/"]}>
      <I18nextProvider i18n={i18n}>
        <QueryClientProvider client={queryClient}>
          <Routes>
            <Route path={CLAIMS_PAGE} element={<ClaimsDashboardPage />} />
          </Routes>
        </QueryClientProvider>
      </I18nextProvider>
    </MemoryRouter>
  );

  it("renders without error", async () => {
    render(<Page />);
    expect(await screen.findByRole("heading", { level: 1 })).toHaveTextContent(
      "Your claims"
    );
  });

  it("cancels a Claim", async () => {
    render(<Page />);
    const cancelButton = screen.getByTestId("processing-id-cancel");
    userEvent.click(cancelButton);
    // TODO check for cancelClaim call
  });
});
