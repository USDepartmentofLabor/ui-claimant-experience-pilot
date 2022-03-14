import { render, screen } from "@testing-library/react";
import { rest } from "msw";
import { setupServer } from "msw/node";
import App from "./App";
import { QueryClient, QueryClientProvider } from "react-query";
import { BrowserRouter } from "react-router-dom";
import { I18nextProvider } from "react-i18next";
import i18n from "./i18n";
import { useGetCompletedClaim } from "./queries/claim";
import { useFeatureFlags } from "./pages/FlagsWrapper/FlagsWrapper";

const server = setupServer(
  rest.get("/api/whoami", (_, res, ctx) => {
    return res(ctx.json({}));
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

jest.mock("./queries/claim");
const mockedUseGetCompletedClaim = useGetCompletedClaim as jest.Mock;
mockedUseGetCompletedClaim.mockImplementation(() => ({
  data: {},
  isFetched: true,
  error: null,
  isError: true,
  isSuccess: false,
}));

jest.mock("./pages/FlagsWrapper/FlagsWrapper");
const mockUseFeatureFlags = useFeatureFlags as jest.Mock;
mockUseFeatureFlags.mockImplementation(() => ({}));

test("renders whoami link", () => {
  const queryClient = new QueryClient({});
  render(
    <I18nextProvider i18n={i18n}>
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          <App />
        </QueryClientProvider>
      </BrowserRouter>
    </I18nextProvider>
  );
  const linkElement = screen.getByText(/who am i/i);
  expect(linkElement).toBeInTheDocument();
});

describe("The Application", () => {
  describe("System admin message", () => {
    it("is not shown by default", () => {
      mockUseFeatureFlags.mockImplementationOnce(() => ({}));

      render(
        <BrowserRouter>
          <QueryClientProvider client={new QueryClient()}>
            <App />
          </QueryClientProvider>
        </BrowserRouter>
      );

      expect(screen.queryByTestId("site-alert")).not.toBeInTheDocument();
    });

    it("is not shown when the LD flag is an empty string", () => {
      mockUseFeatureFlags.mockImplementationOnce(() => ({
        systemAdminMessage: "",
      }));

      render(
        <BrowserRouter>
          <QueryClientProvider client={new QueryClient()}>
            <App />
          </QueryClientProvider>
        </BrowserRouter>
      );

      expect(screen.queryByTestId("site-alert")).not.toBeInTheDocument();
    });

    it("is shown when the LD flag has a value", () => {
      mockUseFeatureFlags.mockImplementationOnce(() => ({
        systemAdminMessage:
          "This is an important message from the site administrator(s)",
      }));

      render(
        <BrowserRouter>
          <QueryClientProvider client={new QueryClient()}>
            <App />
          </QueryClientProvider>
        </BrowserRouter>
      );

      const siteAlert = screen.queryByTestId("site-alert");

      expect(siteAlert).toBeInTheDocument();
      expect(siteAlert).toHaveTextContent(
        "This is an important message from the site administrator(s)"
      );
      expect(siteAlert).toHaveClass("usa-site-alert--info");
    });

    it("allows toggling of the site alert variant", () => {
      mockUseFeatureFlags.mockImplementationOnce(() => ({
        systemAdminMessage:
          "This is an important message from the site administrator(s)",
        systemAdminMessageType: "emergency",
      }));

      render(
        <BrowserRouter>
          <QueryClientProvider client={new QueryClient()}>
            <App />
          </QueryClientProvider>
        </BrowserRouter>
      );

      const siteAlert = screen.queryByTestId("site-alert");

      expect(siteAlert).toBeInTheDocument();
      expect(siteAlert).toHaveTextContent(
        "This is an important message from the site administrator(s)"
      );
      expect(siteAlert).toHaveClass("usa-site-alert--emergency");
    });
  });
});
