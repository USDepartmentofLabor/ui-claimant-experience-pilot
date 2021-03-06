const baseUrl = process.env.REACT_APP_BASE_URL || "";
const Routes = {
  BASE_ROUTE: "/claimant",
  HOME_PAGE: "/",
  WHOAMI_PAGE: "/whoami",
  CLAIM_FORM_PAGE: "/claim/:page/*",
  CLAIM_FORM_HOME: "/claim/",
  CLAIM_FORM_PAGE_SEGMENT: "/claim/:page/:segment/*",
  CLAIMS_PAGE: "/claims",
  SUCCESS_PAGE: "/success/",
  BASE_URL: baseUrl,
  LOGOUT_URL: `${baseUrl}/logout/`,
};

export { Routes };
