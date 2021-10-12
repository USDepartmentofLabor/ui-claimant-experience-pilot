import { render, screen } from "@testing-library/react";
import { rest } from "msw";
import { setupServer } from "msw/node";
import App from "./App";

const server = setupServer(
  rest.get("/api/whoami", (_, res, ctx) => {
    return res(ctx.json({}));
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

test("renders whoami link", () => {
  render(<App />);
  const linkElement = screen.getByText(/who am i/i);
  expect(linkElement).toBeInTheDocument();
});
