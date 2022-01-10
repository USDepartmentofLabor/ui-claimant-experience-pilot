import { Trans, useTranslation } from "react-i18next";
import { Alert, Button, Fieldset } from "@trussworks/react-uswds";
import { EmployerProfile } from "../../../components/form/EmployerProfile/EmployerProfile";
import { YesNoRadio } from "../../../components/form/YesNoRadio/YesNoRadio";
import { ClaimSchemaField } from "../../../common/YupBuilder";
import { useFormikContext } from "formik";
import { IPageDefinition } from "../../PageDefinitions";

const schemaFields: ClaimSchemaField[] = ["employers", "LOCAL_more_employers"];

// TODO: Validate that the number of employers matches the number of times that
//  the claimant has selected "LOCAL_more_employers"

const repeatable = (currentSegment: string | undefined, values: FormValues) => {
  if (!values["LOCAL_more_employers"]) {
    return false;
  }
  const currentSegmentIdx = parseInt(currentSegment || "0");
  return currentSegment === undefined
    ? values.LOCAL_more_employers[0] === "yes"
    : values.LOCAL_more_employers[currentSegmentIdx] === "yes";
};

const nextSegment = (currentSegment: string | undefined) => {
  const currentSegmentIdx = parseInt(currentSegment || "0");
  return currentSegment === undefined ? "1" : currentSegmentIdx + 1 + "";
};

const previousSegment = (currentSegment: string | undefined) => {
  const currentSegmentIdx = parseInt(currentSegment || "0");
  if (currentSegmentIdx - 1 < 0) {
    return false;
  } else {
    return currentSegmentIdx - 1 + "";
  }
};

export const EmployerInformation = (props: PageProps) => {
  const { t } = useTranslation("claimForm");
  const { values, setValues } = useFormikContext<ClaimantInput>();
  const segment = props.segment || "0";

  const removeEmployer = (idx: number) => {
    const employers = values.employers?.filter((_, i) => i !== idx);
    const LOCAL_more_employers = values.LOCAL_more_employers?.filter(
      (_, i) => i !== idx
    );
    setValues((form) => ({
      ...form,
      employers,
      LOCAL_more_employers,
    }));
  };

  return (
    <>
      {values.employers?.map((employer, idx) => (
        <div key={idx}>
          <span>{employer.name}</span>
          &nbsp;
          <Button
            type="button"
            className="usa-button--outline"
            onClick={() => removeEmployer(idx)}
          >
            X [{idx}]
          </Button>
        </div>
      ))}
      {/*TODO: Display only for first segment? ("TBD" in figma)*/}
      <Alert type="info">
        <Trans ns="claimForm" i18nKey="employers.reason_for_data_collection">
          {/*TODO: Just include english text as default here as the docs do?*/}
          employers.reason_for_data_collection
        </Trans>
      </Alert>
      <EmployerProfile segment={segment} />
      <Fieldset legend={t("employers.more_employers.label")}>
        <YesNoRadio
          id={`LOCAL_more_employers[${segment}]`}
          name={`LOCAL_more_employers[${segment}]`}
        />
      </Fieldset>
    </>
  );
};

export const EmployerInformationPage: IPageDefinition = {
  path: "employer-information",
  schemaFields: schemaFields,
  initialValues: {
    employers: [],
    LOCAL_more_employers: [],
  },
  Component: EmployerInformation,
  repeatable: repeatable,
  nextSegment: nextSegment,
  previousSegment: previousSegment,
};
