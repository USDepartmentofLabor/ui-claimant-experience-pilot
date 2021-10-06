/* higher order component for authenticating all React interactions */
import React, { useState, useEffect } from "react";

import httpclient from "../utils/httpclient";

export type WithClaimantProps = {
  currentClaimant: WhoAmI | undefined;
  handleLogin: () => void;
  initializingClaimant: boolean;
  setCurrentClaimant: React.Dispatch<React.SetStateAction<WhoAmI | undefined>>;
};

type FullProps<P extends Record<string, unknown>> = P & WithClaimantProps;

const withClaimant = <P extends Record<string, unknown>>(
  WrappedComponent: React.ComponentType<FullProps<P>>
): React.ComponentType<P> => {
  const ClaimantHOC = (props: P) => {
    const [currentClaimant, setCurrentClaimant] = useState<WhoAmI>();
    const [initializingClaimant, setInitializingClaimant] = useState(true);

    const handleLogin = () => {
      // SSO server
      const base_url = process.env.REACT_APP_BASE_URL || "";
      const login_url = base_url + "/idp/?redirect_to=" + window.location.href;
      window.location.href = login_url;
      console.warn("redirect to idp", login_url);
    };

    useEffect(() => {
      let cancelled = false;

      if (!currentClaimant) {
        httpclient
          .get("/api/whoami/", {
            withCredentials: true,
            headers: { "X-DOL": "axios" },
          })
          .then((resp) => {
            if (cancelled) return;

            // console.log("then", resp);

            if (resp && resp.data) {
              setCurrentClaimant(resp.data);
              setInitializingClaimant(false);
            }
          })
          .catch((err) => {
            if (cancelled) return;

            console.error(err);

            if (err.response) {
              if (err.response.status === 401) {
                handleLogin();
                return;
              }
            }
            // re-throw so our error boundary can handle
            throw err;
          });
      } else {
        if (cancelled) return;
        setInitializingClaimant(false);
      }
      return () => {
        cancelled = true;
      };
    }, [currentClaimant]);

    return (
      <WrappedComponent
        {...props}
        currentClaimant={currentClaimant}
        handleLogin={handleLogin}
        initializingClaimant={initializingClaimant}
        setCurrentClaimant={setCurrentClaimant}
      />
    );
  };

  return ClaimantHOC;
};

export default withClaimant;
