import { useMutation } from "react-query";
import Cookies from "universal-cookie";
import httpclient from "../utils/httpclient";

const submitClaim = (payload: Claim) => {
  const cookies = new Cookies();
  const csrftoken = cookies.get("csrftoken");
  const url = payload.is_complete
    ? "/api/completed-claim/"
    : "/api/partial-claim/";
  return httpclient.post<ClaimResponse>(url, payload, {
    withCredentials: true,
    headers: {
      "X-CSRFToken": csrftoken,
      "Content-Type": "application/json",
    },
  });
};

export const useSubmitClaim = () => {
  return useMutation((payload: Claim) => submitClaim(payload));
};
