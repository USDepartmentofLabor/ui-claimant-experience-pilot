import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "react-query";
import { useWhoAmI } from "../../queries/whoami";
import { useGetCompletedClaim } from "../../queries/claim";
import Success from "./Success";

jest.mock("react-i18next", () => ({
  useTranslation: () => {
    return {
      t: (str: string) => str,
    };
  },
  Trans: ({ i18nKey }: { i18nKey: string }) => <>{i18nKey}</>,
}));
jest.mock("../../queries/whoami");
const mockedUseWhoAmI = useWhoAmI as jest.Mock;
jest.mock("../../queries/claim");
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
  swa: {
    code: "MD",
    name: "Maryland",
    claimant_url: "https://some-test-url.gov",
    featureset: "Claim And Identity",
  },
  identity_provider: "Local",
};

const myCompletedClaim: ClaimantClaim = {
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
};

const renderWithMocks = () => {
  const queryClient = new QueryClient();
  render(
    <QueryClientProvider client={queryClient}>
      <Success />
    </QueryClientProvider>
  );
};

describe("Success screen", () => {
  beforeEach(() => {
    mockedUseWhoAmI.mockImplementation(() => ({
      data: myPII,
      isFetched: true,
      error: null,
      isError: false,
      isSuccess: true,
    }));
    mockedUseGetCompletedClaim.mockImplementation(() => ({
      data: { data: myCompletedClaim },
      isFetched: true,
      error: null,
      isError: false,
      isSuccess: true,
    }));
  });
  it("renders", () => {
    renderWithMocks();
    expect(screen.getByText("success.title")).toBeInTheDocument();
    expect(screen.getByText("success.heading")).toBeInTheDocument();
    expect(screen.getByText("success.message")).toBeInTheDocument();
  });
});
