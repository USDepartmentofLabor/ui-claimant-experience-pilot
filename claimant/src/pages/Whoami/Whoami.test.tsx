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
  beforeEach(() => {
    jest.resetAllMocks();
    mockedUseWhoAmI.mockImplementation(() => ({
      data: {},
      isLoading: false,
      error: null,
      isError: false,
      isSuccess: true,
    }));
  });
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
    jest.spyOn(console, "error");
    console.error.mockImplementation(jest.fn());
    mockedUseWhoAmI.mockImplementation(() => ({
      isSuccess: true,
      data: myPII,
      isLoading: false,
    }));
  });

  afterEach(() => {
    console.error.mockRestore();
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
    expect(list.childElementCount).toBe(8);

    const items = getAllByRole("listitem");
    const piiItems = items.map((item) => item.textContent);
    expect(piiItems).toMatchInlineSnapshot(`
      Array [
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
    mockedUseWhoAmI.mockReturnValueOnce({
      isError: true,
      error: { message: "Error getting myPII data" },
    });

    expect(() => render(whoAmI)).toThrow("Error getting myPII data");
    expect(console.error).toHaveBeenCalled();
    expect(console.error.mock.calls[0][0]).toContain(
      "The above error occurred in the <WhoAmI> component:"
    );
  });
});
