import { Fieldset, IconLaunch, Link } from "@trussworks/react-uswds";
import { Normalize, TFunction, Trans, useTranslation } from "react-i18next";
import { YesNoQuestion } from "../../../components/form/YesNoQuestion/YesNoQuestion";
import { IPageDefinition } from "../../PageDefinitions";
import * as yup from "yup";
import DropdownField from "../../../components/form/fields/DropdownField/DropdownField";
import claimForm from "../../../i18n/en/claimForm";
import HelpText from "../../../components/HelpText/HelpText";
import { useFormikContext } from "formik";
import { RadioField } from "../../../components/form/fields/RadioField/RadioField";
import { useClearFields } from "../../../hooks/useClearFields";
import { useShowErrors } from "../../../hooks/useShowErrors";

export const EducationVocationalRehab = () => {
  const { t } = useTranslation("claimForm");
  const { values } = useFormikContext<ClaimantInput>();
  const showTrainingTypeError = useShowErrors(
    "type_of_college_or_job_training"
  );

  useClearFields(
    !values.attending_college_or_job_training,
    "type_of_college_or_job_training"
  );

  return (
    <>
      <Fieldset legend={t("education_vocational_rehab.education.heading")}>
        <YesNoQuestion
          question={t(
            "education_vocational_rehab.education.attending_training.label"
          )}
          id="attending_college_or_job_training"
          name="attending_college_or_job_training"
        >
          <HelpText>
            {t(
              "education_vocational_rehab.education.attending_training.help_text"
            )}
          </HelpText>
        </YesNoQuestion>
        {values.attending_college_or_job_training && (
          <Fieldset
            legend={t(
              "education_vocational_rehab.education.training_type.label"
            )}
            className={
              showTrainingTypeError
                ? "dol-fieldset usa-form-group--error"
                : "dol-fieldset"
            }
          >
            <RadioField
              name="type_of_college_or_job_training"
              options={Object.keys(
                claimForm.education_vocational_rehab.education.training_type
                  .options
              ).map((option) => ({
                value: option,
                label: t(
                  `education_vocational_rehab.education.training_type.options.${
                    option as Normalize<
                      typeof claimForm.education_vocational_rehab.education.training_type.options
                    >
                  }`
                ),
              }))}
            />
          </Fieldset>
        )}
        <DropdownField
          id="education_level"
          name="education_level"
          label={t("education_level.label")}
          startEmpty
          options={Object.keys(claimForm.education_level.options).map(
            (option) => ({
              value: option,
              label: t(
                `education_level.options.${
                  option as Normalize<typeof claimForm.education_level.options>
                }`
              ),
            })
          )}
        />
      </Fieldset>
      <Fieldset
        legend={t("education_vocational_rehab.vocational_rehab.heading")}
      >
        <YesNoQuestion
          question={t(
            "education_vocational_rehab.vocational_rehab.is_registered.label"
          )}
          id="registered_with_vocational_rehab"
          name="registered_with_vocational_rehab"
        >
          <HelpText withLeftBorder={true}>
            {t(
              "education_vocational_rehab.vocational_rehab.is_registered.help_text.description"
            )}{" "}
            {/*TODO: Do not use NJ specific link below in generic pilot application
                     Either use a USDol link, or have a lookup of links per state*/}
            <Trans
              t={t}
              i18nKey="education_vocational_rehab.vocational_rehab.is_registered.help_text.learn_more_here"
              components={{
                extLink: (
                  <Link
                    variant="external"
                    href="https://www.nj.gov/labor/career-services/special-services/individuals-with-disabilities/"
                    target="blank"
                    rel="noreferrer"
                  >
                    here
                  </Link>
                ),
                span: <span key="new-tab" className="screen-reader-only" />,
                icon: <IconLaunch key="launch" aria-hidden="true" />,
              }}
            />
          </HelpText>
        </YesNoQuestion>
      </Fieldset>
    </>
  );
};

const pageSchema = (t: TFunction<"claimForm">) =>
  yup.object().shape({
    attending_college_or_job_training: yup
      .boolean()
      .required(
        t("education_vocational_rehab.education.attending_training.required")
      ),
    type_of_college_or_job_training: yup
      .string()
      .when("attending_college_or_job_training", {
        is: true,
        then: yup
          .string()
          .oneOf(
            Object.keys(
              claimForm.education_vocational_rehab.education.training_type
                .options
            )
          )
          .required(
            t(
              "education_vocational_rehab.education.training_type.error.required"
            )
          ),
      }),
    education_level: yup
      .mixed()
      .oneOf(Object.keys(claimForm.education_level.options))
      .required(t("education_level.required")),
    registered_with_vocational_rehab: yup
      .boolean()
      .required(
        t("education_vocational_rehab.vocational_rehab.is_registered.required")
      ),
  });

export const EducationVocationalRehabPage: IPageDefinition = {
  path: "education-vocational-rehab",
  heading: "education_vocational_rehab",
  initialValues: {},
  Component: EducationVocationalRehab,
  pageSchema,
};
