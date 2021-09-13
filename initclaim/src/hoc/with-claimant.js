/* higher order component for authenticating all React interactions */
import React, { useState, useEffect } from "react";

import httpclient from "../utils/httpclient";

const withClaimant = (WrappedComponent) => {
  const ClaimantHOC = (props) => {
    const [currentClaimant, setCurrentClaimant] = useState(false);
    const [initializingClaimant, setInitializingClaimant] = useState(true);

    const handleLogin = () => {
      // SSO server
      // if the index.html file has not been served by Django,
      // it will have the {{ templating var delimiter instead of a valid URL.
      const base_url = window.UI_BASE_URL.match(/^\{\{/) ? "https://sandbox.ui.dol.gov:4430" : window.UI_BASE_URL;
      const login_url = base_url + "/idp?redirect_to=" + window.location.href;
      window.location.href = login_url;
      console.warn("redirect to idp", login_url);
    };

    useEffect(() => {
      let cancelled = false;

      if (! currentClaimant) {
        httpclient
          .get("/api/whoami", { withCredentials: true, headers: {"X-DOL": "axios"} })
          .then((resp) => {
            if (cancelled) return;

            console.log("then", resp);

            if (resp && resp.data) {
              setCurrentClaimant(resp.data);
              setInitializingClaimant(false);
            }
          })
          .catch((err) => {
            if (cancelled) return;

            console.error(err);

            handleLogin();
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
