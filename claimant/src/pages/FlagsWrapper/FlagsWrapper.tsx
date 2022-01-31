import React, { useEffect, useState } from "react";
import { asyncWithLDProvider, useFlags } from "launchdarkly-react-client-sdk";

// Extend window interface to include LD key
declare global {
  interface Window {
    LD_CLIENT_SDK_KEY: string;
  }
}

// window var only set in prod builds (when served by Django)
const clientSideID =
  (process.env.NODE_ENV !== "production"
    ? process.env.REACT_APP_LD_CLIENT_SDK_KEY
    : window.LD_CLIENT_SDK_KEY) || "";

type WrapperProps = {
  children: React.ReactNode;
};

const FlagsWrapper = ({ children }: WrapperProps) => {
  // wrapping initial value in function to get around useState and setState thinking
  // the functional component is a function to be evaluated.
  const defaultComponent = () => <div />;
  const [LDProvider, setLDProvider] = useState<React.FunctionComponent>(
    () => defaultComponent
  );

  useEffect(() => {
    (async () => {
      const provider = await asyncWithLDProvider({ clientSideID });
      setLDProvider(() => provider);
    })();
  }, []);

  return <LDProvider>{children}</LDProvider>;
};

const useDefaultFlags = () => {
  if (!process.env.REACT_APP_LD_FLAGS) {
    return {};
  }
  return JSON.parse(process.env.REACT_APP_LD_FLAGS);
};

export default clientSideID ? FlagsWrapper : React.Fragment;
export const useFeatureFlags = clientSideID ? useFlags : useDefaultFlags;
