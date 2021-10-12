import { AxiosError } from "axios";
import { useMutation } from "react-query";
import Cookies from "universal-cookie";
import httpclient from "../utils/httpclient";

const sendEmail = (): Promise<{ ok: "sent" }> => {
  const cookies = new Cookies();
  const csrftoken = cookies.get("csrftoken");
  return httpclient.post(
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
