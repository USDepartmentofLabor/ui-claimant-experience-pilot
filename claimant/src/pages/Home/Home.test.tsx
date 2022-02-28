import { QueryClient, QueryClientProvider } from "react-query";
import { useWhoAmI } from "../../queries/whoami";
import HomePage from "./Home";
import { MemoryRouter } from "react-router-dom";

import { render, screen, within } from "@testing-library/react";
import {
  useGetCompletedClaim,
  useGetPartialClaim,
  useSubmitClaim,
} from "../../queries/claim";

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
const mockedUseSubmitClaim = useSubmitClaim as jest.Mock;

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
  identity_provider: "Local",
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
  identity_provider: "Local",
};

const partialClaim = {
  id: "abc",
  swa_code: "XX",
  claimant_id: "123",
  email: "foo@example.com",
  some: "data",
};
const partialClaimDataForStatus = (
  appStatus: "notStarted" | "inProgress" | "completed"
) => {
  if (appStatus === "notStarted") {
    return { status: "ok", claim: {} };
  } else if (appStatus === "inProgress") {
    return {
      status: "ok",
      claim: { ...partialClaim },
      validation_errors: [true],
    };
  } else if (appStatus === "completed") {
    return { status: "ok", claim: { ...partialClaim } };
  }
};

const renderWithMocks = (
  IAL: WhoAmI["IAL"],
  appStatus: "notStarted" | "inProgress" | "completed",
  featureset?: "Claim And Identity" | "Identity Only" | "Claim Only"
) => {
  const pii = IAL === "1" ? myEmptyPII : myPII;
  const feature = featureset || "Claim And Identity";
  mockedUseWhoAmI.mockImplementation(() => ({
    data: { ...pii, IAL, swa: { ...pii.swa, featureset: feature } },
    isLoading: false,
    error: null,
    isError: false,
    isFetched: true,
  }));
  mockedUseGetCompletedClaim.mockImplementation(() => ({
    data: {},
    status: appStatus === "completed" ? "success" : "error",
    isFetched: true,
    error: null,
    isError: appStatus !== "completed",
    isSuccess: appStatus === "completed",
  }));
  mockedUseGetPartialClaim.mockImplementation(() => ({
    data: partialClaimDataForStatus(appStatus),
    isLoading: false,
    isFetched: true,
    error: false,
    isError: false,
  }));
  mockedUseSubmitClaim.mockImplementation(() => ({
    isFetched: true,
    isError: false,
    mutateAsync: jest.fn(),
    reset: jest.fn(),
    data: { status: 201 },
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
  describe("Claim Application task", () => {
    beforeEach(() => {
      jest.resetAllMocks();
    });
    describe("with featureset Identity Only", () => {
      it("does not show Claim Application task at all", () => {
        renderWithMocks("1", "notStarted", "Identity Only");
        expect(
          screen.queryByText("application.moreInfo.title")
        ).not.toBeInTheDocument();
      });
    });
  });
  describe("Identity task", () => {
    beforeEach(() => {
      jest.resetAllMocks();
    });
    describe("with featureset Claim Only", () => {
      it("does not show ID verification task at all", () => {
        renderWithMocks("1", "notStarted", "Claim Only");
        expect(
          screen.queryByText("identity.moreInfo.title")
        ).not.toBeInTheDocument();
      });
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
      renderWithMocks("1", "completed");
      const app = screen.getByText("application.ready_to_submit.title");
      expect(app).toBeInTheDocument();
      const appContainer = app.parentElement;
      if (!appContainer) throw new Error("No container");
      expect(
        within(appContainer).getByText("status.complete")
      ).toBeInTheDocument();
    });
  });
});
