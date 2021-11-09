import { render, screen, waitFor } from "@testing-library/react";
import HomePage, { ClaimForm } from "./Home";
import { QueryClient, QueryClientProvider } from "react-query";
import { useWhoAmI } from "../../queries/whoami";
import { useSubmitClaim } from "../../queries/claim";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock("../../queries/whoami", () => ({
  useWhoAmI: jest.fn(),
}));
const mockedUseWhoAmI = useWhoAmI as jest.Mock;

jest.mock("../../queries/claim");
const mockedUseSubmitClaim = useSubmitClaim as jest.Mock;

describe("the Home page", () => {
  const queryClient = new QueryClient();
  const Page = (
    <QueryClientProvider client={queryClient}>
      <HomePage />
    </QueryClientProvider>
  );
  it("renders without error", () => {
    render(Page);
    expect(screen.getByRole("heading")).toHaveTextContent("welcome");
  });
});

describe("the ClaimForm", () => {
  const myPII: WhoAmI = {
    claim_id: "123",
    claimant_id: "321",
    form_id: "15",
    first_name: "Hermione",
    last_name: "Granger",
    birthdate: "12/22/2000",
    ssn: "555-55-5555",
    email: "test@example.com",
    phone: "555-555-5555",
    swa_code: "MD",
  };

  const queryClient = new QueryClient();
  const wrappedClaimForm = (
    <QueryClientProvider client={queryClient}>
      <ClaimForm />
    </QueryClientProvider>
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

    const form = render(wrappedClaimForm);

    expect(useWhoAmI).toHaveBeenCalled();
    expect(form.getByRole("button")).toHaveTextContent(
      "sampleForm.claimButton"
    );
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
    mockedUseWhoAmI.mockReturnValueOnce({
      isError: true,
      error: { message: "Error getting your PII" },
    });
    expect(() => render(wrappedClaimForm)).toThrow("Error getting your PII");
  });

  it("renders success message when submitted successfully", () => {
    mockedUseWhoAmI.mockReturnValueOnce({
      data: myPII,
      isError: false,
      error: null,
    });
    mockedUseSubmitClaim.mockReturnValueOnce({
      isSuccess: true,
    });
    render(wrappedClaimForm);
    expect(screen.queryByRole("heading", { level: 4 })).toHaveTextContent(
      "Success status"
    );
  });
});
