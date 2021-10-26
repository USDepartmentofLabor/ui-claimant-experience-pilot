import { render, screen } from "@testing-library/react";
import WhoAmIPage, { WhoAmI } from "./whoami";
import { QueryClient, QueryClientProvider } from "react-query";
// import { useWhoAmI } from "../../queries/whoami";
//
// const whoamiData = {
//     form_id: '123',
//   first_name: 'Toby',
//   last_name: 'Toes',
//   birthdate: '1/1/21',
//   ssn: '666-66-6666',
//   email: 'test@example.com',
//   phone: '555-555-5555'
// };
//
// jest.mock('../../queries/whoami')

describe("the Whoami page", () => {
  const queryClient = new QueryClient();
  const Page = (
    <QueryClientProvider client={queryClient}>
      <WhoAmIPage />
    </QueryClientProvider>
  );

  it("renders without error", () => {
    render(Page);
    expect(screen.getByRole("heading")).toHaveTextContent("Who am I");
  });
});

describe("WhoAmI component", () => {
  const queryClient = new QueryClient();
  it("renders expected values", async () => {
    // const {data, isLoading, error} = useWhoAmI.mockReturnValue(whoamiData);
    render(
      <QueryClientProvider client={queryClient}>
        <WhoAmI />
      </QueryClientProvider>
    );
    expect(screen.getByRole("list")).toHaveTextContent("Form ID");
  });
});
