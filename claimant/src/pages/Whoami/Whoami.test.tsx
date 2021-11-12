import { render, screen, within } from "@testing-library/react";
import WhoAmIPage, { WhoAmI } from "./Whoami";
import { QueryClient, QueryClientProvider } from "react-query";
import { useWhoAmI } from "../../queries/whoami";
import resetAllMocks = jest.resetAllMocks;

jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock("../../queries/whoami");
const mockedUseWhoAmI = useWhoAmI as jest.Mock;

describe("the Whoami page", () => {
  const queryClient = new QueryClient();
  const Page = (
    <QueryClientProvider client={queryClient}>
      <WhoAmIPage />
    </QueryClientProvider>
  );
  it("renders without error", () => {
    render(Page);
    expect(screen.getByRole("heading")).toHaveTextContent("heading");
  });
});

describe("component WhoAmI", () => {
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

  beforeEach(() => {
    resetAllMocks();
    mockedUseWhoAmI.mockImplementation(() => ({
      isSuccess: true,
      data: myPII,
      isLoading: false,
    }));
  });

  const queryClient = new QueryClient();
  const whoAmI = (
    <QueryClientProvider client={queryClient}>
      <WhoAmI />
    </QueryClientProvider>
  );

  it("renders without error", async () => {
    mockedUseWhoAmI.mockReturnValueOnce({
      isSuccess: true,
      data: myPII,
      isLoading: false,
    });
    render(whoAmI);
    const list = screen.getByRole("list");
    const { getAllByRole } = within(list);
    expect(list.childElementCount).toBe(9);

    const items = getAllByRole("listitem");
    const piiItems = items.map((item) => item.textContent);
    expect(piiItems).toMatchInlineSnapshot(`
      Array [
        "info.formId",
        "info.firstName",
        "info.lastName",
        "info.dob",
        "info.email",
        "info.ssn",
        "info.phone",
        "info.SWA",
        "info.claim",
      ]
    `);
  });

  it("renders a loader when loading", () => {
    mockedUseWhoAmI.mockReturnValueOnce({
      isLoading: true,
    });
    render(whoAmI);

    expect(screen.getByTestId("page-loading")).toBeInTheDocument();
  });

  it("throws an error if there is an error", () => {
    jest.spyOn(console, "warn").mockImplementation(jest.fn()); // quells error logs in console
    mockedUseWhoAmI.mockReturnValueOnce({
      isError: true,
      error: { message: "Error getting myPII data" },
    });

    expect(() => render(whoAmI)).toThrow("Error getting myPII data");
  });
});
