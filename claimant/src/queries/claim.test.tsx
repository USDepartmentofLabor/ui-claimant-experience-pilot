import { AxiosInstance } from "axios";
import { renderHook } from "@testing-library/react-hooks";
import { QueryClientProvider, QueryClient } from "react-query";
import httpclient from "../utils/httpclient";
import { useSubmitClaim } from "./claim";

jest.mock("../utils/httpclient");
const mockedHttpClient = httpclient as jest.Mocked<AxiosInstance>;

describe("submit claim", () => {
  const createWrapper = () => {
    const queryClient = new QueryClient();
    const wrapper = ({ children }: any) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    return wrapper;
  };
  it.skip("calls the api and returns the payload", async () => {
    const claimResponse = { status: "submitted", claim_id: "123" };

    mockedHttpClient.post.mockResolvedValueOnce({ data: claimResponse });
    const { result, waitFor } = renderHook(() => useSubmitClaim(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => result.current.isSuccess);

    expect(mockedHttpClient.post).toHaveBeenCalledTimes(1);
    expect(mockedHttpClient.post).toHaveBeenCalledWith("/api/claim");
    expect(result.current.status).toEqual("success");
  });
});
