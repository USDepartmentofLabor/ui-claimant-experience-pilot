import React from "react";
import ReactDOM from "react-dom";
import App from "./App";
import "./i18n";
import { BrowserRouter } from "react-router-dom";
import { Routes as ROUTES } from "./routes";
import { QueryClient, QueryClientProvider } from "react-query";
import FlagsWrapper from "./pages/FlagsWrapper/FlagsWrapper";
import { LiveAnnouncer } from "react-aria-live";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 0,
      // Prevent re-queries on page focus
      refetchOnWindowFocus: false,
      // Cache queries up to five minutes by default
      cacheTime: 1000 * 5 * 60,
      // Queries are immediately stale. Can change on a per-query basis.
      staleTime: 0,
    },
  },
});

ReactDOM.render(
  <React.StrictMode>
    <BrowserRouter basename={ROUTES.BASE_ROUTE}>
      <FlagsWrapper>
        <QueryClientProvider client={queryClient}>
          <LiveAnnouncer>
            <App />
          </LiveAnnouncer>
        </QueryClientProvider>
      </FlagsWrapper>
    </BrowserRouter>
  </React.StrictMode>,
  document.getElementById("root")
);
