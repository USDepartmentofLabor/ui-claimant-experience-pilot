import { render, screen } from "@testing-library/react";
import HomePage, { ClaimForm } from "./Home";
import { QueryClient, QueryClientProvider } from "react-query";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

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
