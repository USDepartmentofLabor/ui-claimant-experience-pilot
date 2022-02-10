import { useState, useEffect } from "react";
import {
  ErrorMessage,
  Label,
  Link,
  FormGroup,
  IconLaunch,
  IconSearch,
  TextInput,
  InputSuffix,
} from "@trussworks/react-uswds";
import { RadioField } from "../fields/RadioField/RadioField";
import { TextAreaField } from "../fields/TextAreaField/TextAreaField";
import { useField, useFormikContext } from "formik";
import { useTranslation } from "react-i18next";

import soc_entries_2018 from "../../../fixtures/soc_entries_2018.json";
import classnames from "classnames";

type OccupationOption = {
  code: string;
  title: string;
  description: string;
  examples: string | null;
};

type SOCEntry = {
  c: string; // code
  t: string; // title
  d: string; // description
  e: string | null; // examples
};

const MIN_JOB_TITLE_LENGTH = 2;

const SOCEntries = soc_entries_2018 as { [key: string]: SOCEntry };

const OccupationEntry = (props: { occupation: OccupationOption }) => {
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
  ) : null;
};

type OccMatch = {
  score: number;
  tokens: string[];
  occupation: SOCEntry;
};

const searchSOCEntries = (searchString: string) => {
  const matches: { [key: string]: OccMatch } = {};

  /* search algorithm
     - tokenize searchString
     - for each token, find matches in entries (case insensitive)
     - score each match based on whether it was full or partial match on word boundaries
     - sum the scores for each match (more tokens matching == bigger score) (we know this is naive)
     - sort by scores
  */
  const tokens = searchString.split(/ +/);
  // console.log({ tokens });
  const matchingOccupations: OccupationOption[] = [];

  tokens.forEach((token) => {
    // allow only alphanumeric
    token = token.replace(/\W/, "");
    if (token.length < 3) {
      return; // skip short tokens
    }
    const fullMatch = new RegExp(`\\b${token}\\b`, "ig");
    // our titles are often plural, but claimant often enters singular.
    // yes, we know this pluralization is grammatically naive.
    const pluralMatch = new RegExp(`\\b${token}e?s\\b`, "ig");
    const partialMatch = new RegExp(`${token}`, "i"); // NOTE no g since we don't match()
    Object.entries(SOCEntries).forEach(([code, occupation]) => {
      let score = 0;
      score += 5 * (occupation.t.match(fullMatch) || []).length;
      score += 4 * (occupation.t.match(pluralMatch) || []).length;
      if (occupation.e) {
        score += 4 * (occupation.e.match(fullMatch) || []).length;
        score += 3 * (occupation.e.match(pluralMatch) || []).length;
      }
      if (
        partialMatch.test(occupation.t) ||
        (occupation.e && partialMatch.test(occupation.e))
      ) {
        score += 2;
      }
      // only try full match on description since there are too many hits otherwise
      score += (occupation.d.match(fullMatch) || []).length;

      if (score) {
        if (code in matches) {
          matches[code].score += score;
          matches[code].tokens.push(token);
        } else {
          matches[code] = {
            score: score,
            tokens: [token],
            occupation: occupation,
          };
        }
      }
    });
  });

  // TODO if we wanted AND boolean logic, filter matches by tokens.length == match.tokens.length
  // TODO since we now sort by rank, consider only returning 10 matches to make it simpler to scroll.

  // console.log({ matches });

  const matchingCodes = Object.keys(matches);
  matchingCodes.sort((a, b) => {
    return (
      matches[b].score * matches[b].tokens.length -
      matches[a].score * matches[a].tokens.length
    );
  });
  matchingCodes.forEach((code) => {
    matchingOccupations.push({
      code: code,
      title: matches[code].occupation.t,
      description: matches[code].occupation.d,
      examples: matches[code].occupation.e,
    });
  });

  return matchingOccupations;
};

export const OccupationPicker = () => {
  const { t } = useTranslation("claimForm", { keyPrefix: "occupation" });
  const { values, setFieldValue } = useFormikContext<ClaimantInput>();
  const [searchFocused, setSearchFocused] = useState(false);

  const [occupationOptions, setOccupationOptions] = useState(
    [] as OccupationOption[]
  );
  const searchSOC = (input: string) => {
    // one or two characters renders too many results
    if (!input || input.length <= MIN_JOB_TITLE_LENGTH) {
      setOccupationOptions([]);
      return;
    }

    const matches = searchSOCEntries(input);
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
        // TODO NJ schema has max length of 255. Why?
        occupation.bls_description = option.description.slice(0, 254);
      }
    });
    setFieldValue("occupation.bls_title", occupation.bls_title);
    setFieldValue("occupation.bls_description", occupation.bls_description);
  }, [values.occupation, occupationOptions]);

  useEffect(() => {
    searchSOC(values.occupation?.job_title as string);
  }, [values.occupation?.job_title]);

  // no results behavior. We want it to present just like a form validation error,
  // but it's dependent on search results, which is not a yup-testable thing.
  const hasNoResults = () => {
    if (occupationOptions && occupationOptions.length) {
      return false;
    } else if (
      (values.occupation?.job_title?.length || 0) > MIN_JOB_TITLE_LENGTH
    ) {
      return true;
    } else if (values.occupation?.job_title?.length === 0) {
      return false;
    }
  };

  const noResultsFlag = hasNoResults();

  const searchGroupClasses = classnames(
    "usa-input-group",
    "usa-input-group--sm",
    {
      "is-focused": searchFocused,
      "usa-input-group--error": showJobTitleError && !searchFocused,
    }
  );

  return (
    <div className="usa-search usa-search--small">
      <FormGroup error={showJobTitleError || noResultsFlag}>
        <Label
          error={showJobTitleError || noResultsFlag}
          htmlFor={jobTitleName}
        >
          {t("what_is_your_occupation.label")}
        </Label>
        <div className={searchGroupClasses}>
          <TextInput
            {...occupationJobTitleFieldProps}
            id={jobTitleName}
            type="text"
            name={jobTitleName}
            autoCapitalize="off"
            autoComplete="off"
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
          />
          <InputSuffix>
            <IconSearch />
          </InputSuffix>
        </div>
        {noResultsFlag && <ErrorMessage>{t("no_results")}</ErrorMessage>}
        {showJobTitleError && (
          <ErrorMessage>{occupationJobTitleMetaProps.error}</ErrorMessage>
        )}
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
      </FormGroup>
      <div className="occupation-options margin-top-2">
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
