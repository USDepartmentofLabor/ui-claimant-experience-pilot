import { useSubmitClaim } from "../queries/claim";
import { PersonalInformation } from "./Questions/PersonalInformation";
import { Submit } from "./Questions/Submit";

export const getPages = ({
  submitClaim,
}: {
  submitClaim: ReturnType<typeof useSubmitClaim>;
}) =>
  [
    { path: "personal-information", render: () => <PersonalInformation /> },
    { path: "submit", render: () => <Submit submitClaim={submitClaim} /> },
  ] as const;

export type FormPath = `/claim/${ReturnType<typeof getPages>[number]["path"]}`;
