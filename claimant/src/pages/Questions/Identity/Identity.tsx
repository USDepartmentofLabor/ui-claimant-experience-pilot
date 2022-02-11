import { Normalize, TFunction, useTranslation } from "react-i18next";
import { Fieldset } from "@trussworks/react-uswds";
import TextField from "../../../components/form/fields/TextField/TextField";
import { DateInputField } from "../../../components/form/fields/DateInputField/DateInputField";
import DropdownField from "../../../components/form/fields/DropdownField/DropdownField";
import { BooleanRadio } from "../../../components/form/BooleanRadio/BooleanRadio";
import claimForm from "../../../i18n/en/claimForm";
import { useFormikContext } from "formik";
import TextAreaField from "../../../components/form/fields/TextAreaField/TextAreaField";
import { useClearFields } from "../../../hooks/useClearFields";
import { IPageDefinition } from "../../PageDefinitions";
import * as yup from "yup";
import { yupDate } from "../../../common/YupBuilder";
import { StatesDropdown } from "../../../components/form/StatesDropdown/StatesDropdown";
import states from "../../../fixtures/states.json";

export const Identity = () => {
  const { t } = useTranslation("claimForm");
  const { values } = useFormikContext<ClaimantInput>();

  const showWorkAuthorizationFields =
    values.work_authorization?.authorized_to_work;

  const showNotAllowedToWorkInUSExplanation =
    values.work_authorization?.authorized_to_work === false;

  const showAlienRegistrationNumber =
    values.work_authorization?.authorization_type &&
    values.work_authorization.authorization_type !== "US_citizen_or_national";

  useClearFields(!showWorkAuthorizationFields, [
    "work_authorization.authorization_type",
    "work_authorization.alien_registration_number",
  ]);

  useClearFields(
    !showNotAllowedToWorkInUSExplanation,
    "work_authorization.not_authorized_to_work_explanation"
  );

  useClearFields(
    !showAlienRegistrationNumber,
    "work_authorization.alien_registration_number"
  );

  return (
    <>
      {/*TODO: number? format validations? auto-hyphen?*/}
      <TextField
        label={t("ssn.label")}
        id="ssn"
        name="ssn"
        type="text"
        readOnly
        disabled
      />
      <DateInputField
        legend={t("birthdate.label")}
        id="birthdate"
        name="birthdate"
        readOnly
        disabled
      />
      <TextField
        label={t("state_credential.drivers_license_or_state_id_number.label")}
        id="state_credential.drivers_license_or_state_id_number"
        name="state_credential.drivers_license_or_state_id_number"
        type="text"
      />
      <StatesDropdown
        label={t("state_credential.issuer.label")}
        id="state_credential.issuer"
        name="state_credential.issuer"
        startEmpty
      />
      <Fieldset legend={t("work_authorization.authorized_to_work.label")}>
        <BooleanRadio
          id="work_authorization.authorized_to_work"
          name="work_authorization.authorized_to_work"
        />
      </Fieldset>
      {showNotAllowedToWorkInUSExplanation && (
        <TextAreaField
          label={t(
            "work_authorization.not_authorized_to_work_explanation.label"
          )}
          id="work_authorization.not_authorized_to_work_explanation"
          name="work_authorization.not_authorized_to_work_explanation"
        />
      )}
      {showWorkAuthorizationFields && (
        <>
          <DropdownField
            label={t("work_authorization.authorization_type.label")}
            id="work_authorization.authorization_type"
            name="work_authorization.authorization_type"
            startEmpty
            options={Object.keys(
              claimForm.work_authorization.authorization_type.options
            ).map((optionKey) => ({
              label: t(
                `work_authorization.authorization_type.options.${
                  optionKey as Normalize<
                    typeof claimForm.work_authorization.authorization_type.options
                  >
                }`
              ),
              value: optionKey,
            }))}
          />
          {showAlienRegistrationNumber && (
            <TextField
              label={t("work_authorization.alien_registration_number.label")}
              id="work_authorization.alien_registration_number"
              name="work_authorization.alien_registration_number"
              type="text"
            />
          )}
        </>
      )}
    </>
  );
};

const pageSchema = (t: TFunction<"claimForm">) =>
  yup.object().shape({
    ssn: yup.string().required(t("ssn.required")),
    birthdate: yupDate(t, t("birthdate.label")),

    state_credential: yup.object().shape({
      drivers_license_or_state_id_number: yup
        .string()
        .required(
          t("state_credential.drivers_license_or_state_id_number.required")
        ),
      issuer: yup
        .string()
        .oneOf(Object.keys(states))
        .required(t("state_credential.issuer.required")),
    }),

    work_authorization: yup.object().shape({
      authorized_to_work: yup
        .boolean()
        .required(t("work_authorization.authorized_to_work.required")),
      not_authorized_to_work_explanation: yup
        .string()
        .when("authorized_to_work", {
          is: false,
          then: yup
            .string()
            .required(
              t(
                "work_authorization.not_authorized_to_work_explanation.required"
              )
            ),
        }),
      authorization_type: yup.string().when("authorized_to_work", {
        is: true,
        then: yup
          .string()
          .oneOf(
            Object.keys(claimForm.work_authorization.authorization_type.options)
          )
          .required(t("work_authorization.authorization_type.required")),
      }),
      alien_registration_number: yup.string().when("authorization_type", {
        is: (alienRegistrationType: string) =>
          alienRegistrationType &&
          alienRegistrationType !== "US_citizen_or_national",
        then: yup
          .string()
          .matches(
            /^[0-9]{3}-?[0-9]{3}-?[0-9]{3}$/,
            t("work_authorization.alien_registration_number.format")
          )
          .required(t("work_authorization.alien_registration_number.required")),
      }),
    }),
  });

export const IdentityPage: IPageDefinition = {
  path: "identity",
  heading: "identity",
  initialValues: {
    birthdate: "",
    ssn: "",
    work_authorization: {
      authorized_to_work: undefined,
      not_authorized_to_work_explanation: undefined,
      authorization_type: undefined,
      alien_registration_number: undefined,
    },
    state_credential: {
      drivers_license_or_state_id_number: "",
      issuer: undefined,
    },
  },
  Component: Identity,
  pageSchema,
};
