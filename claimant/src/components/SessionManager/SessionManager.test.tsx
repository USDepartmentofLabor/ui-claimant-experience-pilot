import { act, render, screen } from "@testing-library/react";
import { QueryClientProvider, QueryClient } from "react-query";
import { SessionManager } from "./SessionManager";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
  Trans: ({ i18nKey }: { i18nKey: string }) => i18nKey,
}));
jest.mock("../../queries/whoami", () => ({
  useWhoAmI: jest.fn(() => ({ refetch: jest.fn() })),
}));

const setUpWithExpiryTime = (seconds: number) => {
  jest.useFakeTimers();
  Object.defineProperty(window.document, "cookie", {
    writable: true,
    value: `expires_at=${seconds}`,
  });
  render(
    <QueryClientProvider client={new QueryClient()}>
      <SessionManager />
    </QueryClientProvider>
  );
  act(() => {
    jest.advanceTimersByTime(5000);
  });
};

describe("SessionManager", () => {
  it("displays the modal inside the warning period", async () => {
    setUpWithExpiryTime(100);
    expect(screen.getByText("timeout.instructions")).toBeInTheDocument();
  });
  it("doesn't display the modal outside the warning period", async () => {
    setUpWithExpiryTime(10000);
    expect(screen.queryByText("timeout.instructions")).not.toBeInTheDocument();
  });
});
