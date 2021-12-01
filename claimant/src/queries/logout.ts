import { useMutation } from "react-query";
import Cookies from "universal-cookie";
import httpclient from "../utils/httpclient";

const logout = () => {
  const cookies = new Cookies();
  const csrftoken = cookies.get("csrftoken");
  return httpclient.post(
    "/api/logout/",
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

export const useLogout = () => {
  return useMutation(() => logout(), {
    onSuccess: async () => window.location.replace("/"),
    onError: async (error) => {
      throw error;
    },
  });
};
