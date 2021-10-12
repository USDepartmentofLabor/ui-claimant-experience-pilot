import { AxiosError } from "axios";
import { useQuery } from "react-query";
import httpclient from "../utils/httpclient";

const getWhoAmI = async (): Promise<WhoAmI> => {
  const { data } = await httpclient.get("/api/whoami/", {
    withCredentials: true,
    headers: { "X-DOL": "axios" },
  });
  return data;
};

export const useWhoAmI = () => {
  return useQuery<WhoAmI, AxiosError>("whoami", () => getWhoAmI(), {
    staleTime: 1000 * 5 * 60,
  });
};
