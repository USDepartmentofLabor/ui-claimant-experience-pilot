import { QueryClient, QueryClientProvider } from "react-query";
import { useWhoAmI } from "../../queries/whoami";
import HomePage from "./Home";
import { MemoryRouter } from "react-router-dom";

import { render, screen, within } from "@testing-library/react";
import { useGetCompletedClaim, useGetPartialClaim } from "../../queries/claim";

jest.mock("react-i18next", () => ({
  useTranslation: () => {
    return {
      t: (str: string, option?: { returnObjects: boolean }) => {
        if (option?.returnObjects) {
          return ["a", "b", "c"];
        }
        return str;
      },
    };
  },
  Trans: ({ i18nKey }: { i18nKey: string }) => <>{i18nKey}</>,
}));

jest.mock("../../queries/whoami");
jest.mock("../../queries/claim");
const mockedUseWhoAmI = useWhoAmI as jest.Mock;
const mockedUseGetPartialClaim = useGetPartialClaim as jest.Mock;
const mockedUseGetCompletedClaim = useGetCompletedClaim as jest.Mock;

const myPII: WhoAmI = {
  IAL: "2",
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
};

const myEmptyPII: WhoAmI = {
  IAL: "1",
  claim_id: "123",
  claimant_id: "321",
  first_name: "",
  last_name: "",
  birthdate: "",
  ssn: "",
  email: "test@example.com",
  phone: "",
  swa: {
    code: "MD",
    name: "Maryland",
    claimant_url: "https://some-test-url.gov",
    featureset: "Claim And Identity",
  },
};

const renderWithMocks = (
  IAL: WhoAmI["IAL"],
  appStatus: "notStarted" | "inProgress" | "ready"
) => {
  const pii = IAL === "1" ? myEmptyPII : myPII;
  mockedUseWhoAmI.mockImplementation(() => ({
    data: { ...pii, IAL },
    isLoading: false,
    error: null,
    isError: false,
    isFetched: true,
  }));
  mockedUseGetCompletedClaim.mockImplementation(() => ({
    data: {},
    status: appStatus === "ready" ? "success" : "error",
    isFetched: true,
    error: null,
    isError: appStatus !== "ready",
    isSuccess: appStatus === "ready",
  }));
  mockedUseGetPartialClaim.mockImplementation(() => ({
    data:
      appStatus === "inProgress"
        ? { status: "ok", claim: { some: "data" } }
        : { status: "ok", claim: {} },
    isLoading: false,
    isFetched: true,
    error: false,
    isError: false,
  }));
  const queryClient = new QueryClient();
  render(
    <MemoryRouter initialEntries={["/"]}>
      <QueryClientProvider client={queryClient}>
        <HomePage />
      </QueryClientProvider>
    </MemoryRouter>
  );
};

describe("the Home page", () => {
  describe("with IAL2", () => {
    beforeEach(() => {
      jest.resetAllMocks();
    });
    it("shows ID verification not started", () => {
      renderWithMocks("1", "notStarted");
      const welcome = screen.getByRole("heading", { level: 1 });
      expect(welcome.textContent).toEqual("namelessWelcome");
      const identityMoreInfo = screen.getByText("identity.moreInfo.title");
      expect(identityMoreInfo).toBeInTheDocument();
      const verified = screen.getByText("identity.not_started.title");
      expect(verified).toBeInTheDocument();
      const verifiedContainer = verified.parentElement;
      if (!verifiedContainer) throw new Error("No container");
      expect(
        within(verifiedContainer).getByText("status.not_started")
      ).toBeInTheDocument();
    });
    it("shows ID verification complete", () => {
      renderWithMocks("2", "notStarted");
      const welcome = screen.getByRole("heading", { level: 1 });
      expect(welcome.textContent).toContain(`welcome, ${myPII.first_name}`);
      const verified = screen.getByText("identity.complete.title");
      expect(verified).toBeInTheDocument();
      const verifiedContainer = verified.parentElement;
      if (!verifiedContainer) throw new Error("No container");
      expect(
        within(verifiedContainer).getByText("status.complete")
      ).toBeInTheDocument();
    });
    it("shows app not started", () => {
      renderWithMocks("1", "notStarted");
      const appMoreInfo = screen.getByText("application.moreInfo.title");
      expect(appMoreInfo).toBeInTheDocument();
      const app = screen.getByText("application.not_ready_to_submit.title");
      expect(app).toBeInTheDocument();
      const appContainer = app.parentElement;
      if (!appContainer) throw new Error("No container");
      expect(
        within(appContainer).getByText("status.not_started")
      ).toBeInTheDocument();
    });
    it("shows app in progress", () => {
      renderWithMocks("1", "inProgress");
      const app = screen.getByText("application.not_ready_to_submit.title");
      expect(app).toBeInTheDocument();
      const appContainer = app.parentElement;
      if (!appContainer) throw new Error("No container");
      expect(
        within(appContainer).getByText("status.in_progress")
      ).toBeInTheDocument();
    });
    it("shows app ready to submit", () => {
      renderWithMocks("1", "ready");
      const app = screen.getByText("application.ready_to_submit.title");
      expect(app).toBeInTheDocument();
      const appContainer = app.parentElement;
      if (!appContainer) throw new Error("No container");
      expect(
        within(appContainer).getByText("status.ready_to_submit")
      ).toBeInTheDocument();
    });
  });
});
