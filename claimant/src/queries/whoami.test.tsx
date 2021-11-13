import React from "react";
import { AxiosInstance } from "axios";
import { renderHook } from "@testing-library/react-hooks";
import { QueryClient, QueryClientProvider } from "react-query";
import httpclient from "../utils/httpclient";
import { useWhoAmI } from "./whoami";

const whoIsYou: WhoAmI = {
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

jest.mock("../utils/httpclient");
const mockedHttpClient = httpclient as jest.Mocked<AxiosInstance>;

describe("should use whoami", () => {
  const queryClient = new QueryClient();
  const wrapper = ({ children }: any) => {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
  it("calls the query and returns the expected data", async () => {
    mockedHttpClient.get.mockResolvedValueOnce({ data: whoIsYou });
    const { result, waitFor } = renderHook(() => useWhoAmI(), { wrapper });

    await waitFor(() => result.current.isSuccess);

    expect(mockedHttpClient.get).toHaveBeenCalledTimes(1);
    expect(result.current.data).toEqual(whoIsYou);
  });
});