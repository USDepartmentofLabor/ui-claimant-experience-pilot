import { PropsWithChildren, ReactNode } from "react";
import { renderHook } from "@testing-library/react-hooks";
import { QueryClient, QueryClientProvider } from "react-query";
import httpclient from "../utils/httpclient";
import { useWhoAmI } from "./whoami";

const whoIsYou: WhoAmI = {
  IAL: "2",
  claim_id: "123",
  claimant_id: "321",
  first_name: "Hermione",
  last_name: "Granger",
  birthdate: "12/22/2000",
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

jest.mock("../utils/httpclient");
const mockedGet = httpclient.get as jest.Mock & typeof httpclient;

describe("should use whoami", () => {
  const queryClient = new QueryClient();
  const wrapper = ({ children }: PropsWithChildren<ReactNode>) => {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
  it("calls the query and returns the expected data", async () => {
    mockedGet.mockResolvedValueOnce({ data: whoIsYou });
    const { result, waitFor } = renderHook(() => useWhoAmI(), { wrapper });

    await waitFor(() => result.current.isSuccess);

    expect(mockedGet).toHaveBeenCalledTimes(1);
    expect(result.current.data).toEqual(whoIsYou);
  });
});
