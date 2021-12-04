import { useSubmitClaim } from "../queries/claim";
import {
  PersonalInformation,
  PersonalInformationFields,
} from "./Questions/PersonalInformation";
import { Submit, SubmitFields } from "./Questions/Submit";
export const getPages = ({
  submitClaim,
}: {
  submitClaim: ReturnType<typeof useSubmitClaim>;
}) =>
  [
    {
      path: "personal-information",
      fields: PersonalInformationFields,
      render: () => <PersonalInformation />,
    },
    {
      path: "submit",
      fields: SubmitFields,
      render: () => <Submit submitClaim={submitClaim} />,
    },
  ] as const;

export type FormPath = `/claim/${ReturnType<typeof getPages>[number]["path"]}`;
