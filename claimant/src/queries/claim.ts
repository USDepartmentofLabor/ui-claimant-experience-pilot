import { useMutation, useQuery } from "react-query";
import Cookies from "universal-cookie";
import httpclient from "../utils/httpclient";

const COMPLETED_CLAIM_ENDPOINT = "/api/completed-claim/";

const submitClaim = (payload: Claim) => {
  const cookies = new Cookies();
  const csrftoken = cookies.get("csrftoken");
  const url = payload.is_complete
    ? COMPLETED_CLAIM_ENDPOINT
    : "/api/partial-claim/";
  return httpclient.post<ClaimResponse>(url, payload, {
    withCredentials: true,
    headers: {
      "X-CSRFToken": csrftoken,
      "Content-Type": "application/json",
    },
  });
};

const getCompletedClaim = () => {
  return httpclient.get(COMPLETED_CLAIM_ENDPOINT, { withCredentials: true });
};

export const useSubmitClaim = () => {
  return useMutation((payload: Claim) => submitClaim(payload));
};

export const useGetCompletedClaim = () => {
  return useQuery("getCompletedClaim", () => getCompletedClaim());
};
