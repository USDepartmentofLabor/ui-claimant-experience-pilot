import { AxiosError } from "axios";
import { useMutation, useQuery } from "react-query";
import Cookies from "universal-cookie";
import httpclient from "../utils/httpclient";

const getClaims = async () => {
  const { data } = await httpclient.get<ApiClaimsResponse>("/api/claims/", {
    withCredentials: true,
    headers: { "X-DOL": "axios" },
  });
  return data;
};

export const useClaims = () => {
  return useQuery<ApiClaimsResponse, AxiosError>("claims", () => getClaims(), {
    staleTime: 1000 * 5 * 60,
  });
};

const cancelClaim = async (claim_id: string) => {
  const cookies = new Cookies();
  const csrftoken = cookies.get("csrftoken");
  const { data } = await httpclient.delete<ApiResponse>(
    `/api/cancel-claim/${claim_id}/`,
    {
      withCredentials: true,
      headers: {
        "X-CSRFToken": csrftoken,
        "Content-Type": "application/json",
      },
    }
  );
  return data;
};

export const useCancelClaim = () => {
  return useMutation((claim_id: string) => cancelClaim(claim_id));
};
