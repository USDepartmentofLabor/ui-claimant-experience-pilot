import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "react-query";
import { useWhoAmI } from "../../queries/whoami";
import HomePage from "./Home";
import { MemoryRouter } from "react-router-dom";
import { I18nextProvider } from "react-i18next";
import i18n from "../../i18n";

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
  swa_code: "MD",
};

describe("the Home page", () => {
  beforeEach(() => {
    jest.spyOn(console, "error");
    (console.error as jest.Mock).mockImplementation(jest.fn());
  });

  afterEach(() => {
    (console.error as jest.Mock).mockRestore();
  });

  beforeEach(() => {
    jest.resetAllMocks();
    mockedUseWhoAmI.mockImplementation(() => ({
      data: myPII,
      isLoading: false,
      error: null,
      isError: false,
    }));
  });
  const queryClient = new QueryClient();
  const Page = (
    <MemoryRouter initialEntries={["/"]}>
      <I18nextProvider i18n={i18n}>
        <QueryClientProvider client={queryClient}>
          <HomePage />
        </QueryClientProvider>
      </I18nextProvider>
    </MemoryRouter>
  );
  it("renders without error", async () => {
    render(Page);
    expect(await screen.findByRole("heading")).toHaveTextContent("Welcome");
  });

  it("shows the loader when loading", () => {
    mockedUseWhoAmI.mockReturnValueOnce({
      isLoading: true,
    });
    render(Page);
    expect(screen.queryByTestId("page-loading")).toBeInTheDocument();
    expect(screen.queryByTestId("claim-submission")).not.toBeInTheDocument();
  });

  it("throws an error if there is an error returned", () => {
    mockedUseWhoAmI.mockReturnValue({
      error: { message: "Error getting your PII" },
    });

    expect(() => render(Page)).toThrow("Error getting your PII");
    expect(console.error).toHaveBeenCalled();
    expect((console.error as jest.Mock).mock.calls[0][0]).toContain(
      "Error: Uncaught { message: 'Error getting your PII' }"
    );
  });
});
