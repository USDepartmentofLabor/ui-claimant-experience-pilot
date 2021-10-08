import { RequestWrapper } from "../queries/RequestWrapper";
import { useWhoAmI } from "../queries/whoami";

const Auth: React.FC = ({ children }) => {
  useWhoAmI();
  return <>{children}</>;
};

const AuthLoader = () => (
  <>
    <img
      src="https://www.dol.gov/themes/opa_theme/img/logo-primary.svg"
      alt="logo"
      height="200"
    />
    <h2>Checking authorization...</h2>
  </>
);

export const AuthContainer: React.FC = ({ children }) => {
  return (
    <RequestWrapper fallback={<AuthLoader />}>
      <Auth>{children}</Auth>
    </RequestWrapper>
  );
};
