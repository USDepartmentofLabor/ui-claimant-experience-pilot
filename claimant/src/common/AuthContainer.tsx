import { RequestErrorBoundary } from "../queries/RequestErrorBoundary";
import { useWhoAmI } from "../queries/whoami";

const Auth: React.FC = ({ children }) => {
  const { error, isLoading } = useWhoAmI();

  if (isLoading) {
    return <AuthLoader />;
  }

  if (error) {
    throw error;
  }

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
    <RequestErrorBoundary>
      <Auth>{children}</Auth>
    </RequestErrorBoundary>
  );
};
