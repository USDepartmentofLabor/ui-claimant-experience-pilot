import { Suspense } from "react";
import { RequestErrorBoundary } from "./RequestErrorBoundary";

type Props = {
  fallback?: JSX.Element;
};

export const RequestWrapper: React.FC<Props> = ({ children, fallback }) => (
  <RequestErrorBoundary>
    <Suspense fallback={fallback || <>Loading</>}>{children}</Suspense>
  </RequestErrorBoundary>
);
