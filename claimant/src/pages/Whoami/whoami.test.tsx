import { render, screen } from "@testing-library/react";
import WhoAmIPage from "./whoami";
import { QueryClient, QueryClientProvider } from "react-query";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

describe("the Whoami page", () => {
  const queryClient = new QueryClient();
  const Page = (
    <QueryClientProvider client={queryClient}>
      <WhoAmIPage />
    </QueryClientProvider>
  );
  it("renders without error", () => {
    render(Page);
    expect(screen.getByRole("heading")).toHaveTextContent("whoamiHeading");
  });
});
