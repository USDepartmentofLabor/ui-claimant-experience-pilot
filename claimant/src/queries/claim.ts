import { AxiosError } from "axios";
import { useMutation } from "react-query";
import Cookies from "universal-cookie";
import httpclient from "../utils/httpclient";

const sendEmail = () => {
  const cookies = new Cookies();
  const csrftoken = cookies.get("csrftoken");
  return httpclient.post<Record<string, never>, { ok: "sent" }>(
    "/api/claim/",
    {},
    {
      withCredentials: true,
      headers: {
        "X-CSRFToken": csrftoken,
        "Content-Type": "application/json",
      },
    }
  );
};

export const useSendEmail = () => {
  return useMutation<Record<string, unknown>, AxiosError>(() => sendEmail());
};
