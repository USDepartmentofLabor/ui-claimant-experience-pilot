import { render, screen } from "@testing-library/react";
import { rest } from "msw";
import { setupServer } from "msw/node";
import App from "./App";
import { QueryClient, QueryClientProvider } from "react-query";
import { BrowserRouter } from "react-router-dom";
import { I18nextProvider } from "react-i18next";
import i18n from "./i18n";
import { useGetCompletedClaim } from "./queries/claim";

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
