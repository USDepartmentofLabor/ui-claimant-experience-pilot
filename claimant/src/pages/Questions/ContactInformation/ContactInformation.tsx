import { TFunction, useTranslation } from "react-i18next";
import { FieldArray, useFormikContext } from "formik";
import { TextField } from "../../../components/form/fields/TextField/TextField";
import { IPageDefinition } from "../../PageDefinitions";
import { YesNoQuestion } from "../../../components/form/YesNoQuestion/YesNoQuestion";
import { CheckboxField } from "../../../components/form/fields/CheckboxField/CheckboxField";
import { PhoneNumberField } from "../../../components/form/PhoneNumberField/PhoneNumberField";
import { yupPhone } from "../../../common/YupBuilder";
import * as yup from "yup";
import { useClearFields } from "../../../hooks/useClearFields";
import { PHONE_SKELETON } from "../../../utils/claim_form";
import { VerifiedFields } from "../../../components/form/VerifiedFields/VerifiedFields";

const pageSchema = (t: TFunction<"claimForm">) =>
  yup.object().shape({
    // email is not editable, so omit required() but include the schema def just in case.
    email: yup.string().email(),
    phones: yup.array().when("LOCAL_more_phones", {
      is: true,
      then: yup.array().of(yupPhone(t)).min(2).required(),
      otherwise: yup.array().of(yupPhone(t)).min(1).required(),
    }),
    interpreter_required: yup
      .boolean()
      .required(t("contact_information.interpreter_required.required")),
    preferred_language: yup.string().when("interpreter_required", {
      is: true,
      then: yup
        .string()
        .required(t("contact_information.preferred_language.required")),
    }),
  });

export const ContactInformation = () => {
  const { t } = useTranslation("claimForm", {
    keyPrefix: "contact_information",
  });
  const { values } = useFormikContext<ClaimantInput>();

  // Remove phones[1] if unchecked
  useClearFields(
    !values.LOCAL_more_phones && values.phones && values.phones.length > 1,
    {
      fieldName: "phones",
      value: [values.phones?.[0]],
    }
  );

  return (
    <>
      <VerifiedFields fields={["email", "phone"]} />
      <FieldArray
        name="phones"
        render={(arrayHelpers) => (
          <>
            <PhoneNumberField id="phones[0]" name="phones[0]" showSMS={false} />
            <CheckboxField
              name="LOCAL_more_phones"
              data-testid="LOCAL_more_phones"
              label={t("more_phones")}
              onChange={(e) => {
                if (e.target.checked) {
                  values.phones?.length === 1 &&
                    arrayHelpers.push({ ...PHONE_SKELETON });
                } else {
                  (values.phones?.length || 0) >= 2 && arrayHelpers.remove(1);
                }
              }}
            />
            {values.LOCAL_more_phones && (
              <PhoneNumberField
                id="phones[1]"
                name="phones[1]"
                showSMS={false}
              />
            )}
          </>
        )}
      />

      <TextField
        name="email"
        type="text"
        label={t("email")}
        disabled
        readOnly
      />
      <YesNoQuestion
        question={t("interpreter_required.label")}
        id="interpreter_required"
        name="interpreter_required"
      />
      {values.interpreter_required && (
        <TextField
          label={t("preferred_language.label")}
          name="preferred_language"
          type="text"
        />
      )}
    </>
  );
};

export const ContactInformationPage: IPageDefinition = {
  path: "contact",
  heading: "contact",
  initialValues: {
    email: undefined, // whoami will populate
    phones: [{ ...PHONE_SKELETON }],
    LOCAL_more_phones: undefined,
    interpreter_required: undefined,
    preferred_language: "",
  },
  Component: ContactInformation,
  pageSchema,
};
