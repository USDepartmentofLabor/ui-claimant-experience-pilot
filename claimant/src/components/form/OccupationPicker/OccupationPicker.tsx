import { useState, useEffect } from "react";
import {
  Label,
  Link,
  ErrorMessage,
  FormGroup,
  IconLaunch,
  IconSearch,
  TextInput,
} from "@trussworks/react-uswds";
import { RadioField } from "../fields/RadioField/RadioField";
import { TextAreaField } from "../fields/TextAreaField/TextAreaField";
import { useField, useFormikContext } from "formik";
import { useTranslation } from "react-i18next";

import soc_structure_2018 from "../../../schemas/soc_structure_2018.json";

type OccupationOption = {
  code: string;
  title: string;
  description: string;
  examples: string | null;
};

type SOCEntry = {
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  [key: string]: string | any;
};

const SOCEntries = soc_structure_2018 as SOCEntry;

const OccupationEntry = (props: { occupation: SOCEntry }) => {
  const entry = props.occupation;
  return (
    <>
      <span>{entry.title}</span>
      <div className="usa-checkbox__label-description">
        {entry.description}
        {entry.examples && <div>Examples: {entry.examples}</div>}
      </div>
    </>
  );
};

type OccupationListProps = {
  occupationOptions: OccupationOption[];
};

const OccupationList = (props: OccupationListProps) => {
  const occupationOptions = props.occupationOptions;
  const { t } = useTranslation("claimForm", { keyPrefix: "occupation" });
  return occupationOptions.length ? (
    <>
      <div>{t("choose_the_occupation")}</div>
      <RadioField
        tile
        id="occupation.bls_code"
        name="occupation.bls_code"
        options={occupationOptions.map((option) => {
          return {
            label: <OccupationEntry occupation={option} />,
            value: option.code,
          };
        })}
      />
    </>
  ) : (
    <div>{t("no_results")}</div>
  );
};

const searchSOCLabels = (searchPattern: RegExp) => {
  const matches: OccupationOption[] = [];

  // structure is major, minor, broad, detailed
  Object.keys(SOCEntries).forEach((majorId) => {
    // const majorLabel = soc_structure_2018[majorId]._label;
    const minorIds = Object.keys(SOCEntries[majorId] as SOCEntry).filter(
      (el) => el !== "_label"
    );
    minorIds.forEach((minorId) => {
      const minorLabel = SOCEntries[majorId][minorId]._label;
      const broadIds = Object.keys(SOCEntries[majorId][minorId]).filter(
        (el) => el !== "_label"
      );
      broadIds.forEach((broadId) => {
        const broadLabel = SOCEntries[majorId][minorId][broadId]._label;
        const detailIds = Object.keys(
          SOCEntries[majorId][minorId][broadId]
        ).filter((el) => el !== "_label");
        detailIds.forEach((detailId) => {
          const detail = SOCEntries[majorId][minorId][broadId][detailId];
          if (
            searchPattern.test(broadLabel) ||
            searchPattern.test(minorLabel) ||
            searchPattern.test(detail.title) ||
            searchPattern.test(detail.desc) ||
            searchPattern.test(detail.ex)
          ) {
            matches.push({
              code: detailId,
              title: detail.title,
              description: detail.desc,
              examples: detail.ex,
            });
          }
        });
      });
    });
  });
  return matches;
};

export const OccupationPicker = () => {
  const { t } = useTranslation("claimForm", { keyPrefix: "occupation" });
  const { values, setFieldValue } = useFormikContext<ClaimantInput>();

  const [occupationOptions, setOccupationOptions] = useState(
    [] as OccupationOption[]
  );
  const searchSOC = (input: string) => {
    // one or two characters renders too many results
    if (!input || input.length < 3) {
      setOccupationOptions([]);
      return;
    }

    // TODO escaping?
    const searchPattern = new RegExp(input.replace(/ +/, "|"), "i");

    const matches = searchSOCLabels(searchPattern);
    setOccupationOptions(matches);
  };

  const jobTitleName = "occupation.job_title";
  const jobDescriptionName = "occupation.job_description";

  const [occupationJobTitleFieldProps, occupationJobTitleMetaProps] = useField({
    name: jobTitleName,
  });
  const showJobTitleError =
    occupationJobTitleMetaProps.touched && !!occupationJobTitleMetaProps.error;

  useEffect(() => {
    const occupation = {
      bls_code: values.occupation?.bls_code,
      bls_title: "",
      bls_description: "",
    };
    // lookup the match
    occupationOptions.forEach((option) => {
      if (option.code === occupation.bls_code) {
        occupation.bls_title = option.title;
        occupation.bls_description = option.description;
      }
    });
    setFieldValue("occupation.bls_title", occupation.bls_title);
    setFieldValue("occupation.bls_description", occupation.bls_description);
  }, [values.occupation, occupationOptions]);

  useEffect(() => {
    searchSOC(values.occupation?.job_title as string);
  }, [values.occupation?.job_title]);

  return (
    <div className="usa-search usa-search--small">
      <h3>{t("heading")}</h3>
      <FormGroup error={showJobTitleError}>
        <Label error={showJobTitleError} htmlFor={jobTitleName}>
          {t("what_is_your_occupation.label")}
        </Label>
        <div className="usa-input-group usa-input-group--sm">
          <TextInput
            {...occupationJobTitleFieldProps}
            id={jobTitleName}
            type="text"
            name={jobTitleName}
            autoCapitalize="off"
            autoComplete="off"
          />
          <div className="usa-input-suffix" aria-hidden="true">
            <IconSearch />
          </div>
        </div>
        <div className="usa-hint" id="occupation-hint">
          {t("hint")}{" "}
          <Link
            variant="external"
            href="https://www.bls.gov/soc/2018/major_groups.htm"
            target="_blank"
            rel="noopener noreferrer"
          >
            {t("list_of_occupations")}
            <span className="screen-reader-only">
              ({t("opens_in_a_new_tab")})
            </span>
            <IconLaunch size={3} aria-hidden="true" />
          </Link>
          .
        </div>
        {showJobTitleError && (
          <ErrorMessage>{occupationJobTitleMetaProps.error}</ErrorMessage>
        )}
      </FormGroup>
      <div className="occupation-options">
        <OccupationList occupationOptions={occupationOptions} />
      </div>
      <TextAreaField
        id={jobDescriptionName}
        name={jobDescriptionName}
        label={t("short_description.label")}
      />
    </div>
  );
};
