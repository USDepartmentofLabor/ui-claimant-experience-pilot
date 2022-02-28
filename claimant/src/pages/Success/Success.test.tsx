import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "react-query";
import { useWhoAmI } from "../../queries/whoami";
import Success from "./Success";

jest.mock("react-i18next", () => ({
  useTranslation: () => {
    return {
      t: (str: string) => str,
    };
  },
}));
jest.mock("../../queries/whoami");
const mockedUseWhoAmI = useWhoAmI as jest.Mock;

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

const renderWithMocks = (justFinished?: boolean) => {
  const queryClient = new QueryClient();
  render(
    <QueryClientProvider client={queryClient}>
      <Success justFinished={justFinished} />
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
  });
  it("renders after just submitted", () => {
    renderWithMocks(true);
    expect(screen.getByText("success.just_finished.title")).toBeInTheDocument();
    expect(
      screen.getByText("success.just_finished.message")
    ).toBeInTheDocument();
  });
  it("renders when coming back to app", () => {
    renderWithMocks(false);
    expect(screen.getByText("success.returning.title")).toBeInTheDocument();
    expect(screen.getByText("success.returning.message")).toBeInTheDocument();
  });
});
