import HelpText from "../../HelpText/HelpText";
import { Link } from "@trussworks/react-uswds";
import classes from "./VerifiedFields.module.scss";
import { ReactComponent as Logo } from "../../../images/logindotgov/login-gov-logo.svg";
import { Normalize, useTranslation } from "react-i18next";
import { useWhoAmI } from "../../../queries/whoami";
import whoami from "../../../i18n/en/whoami";
import { VerifiedField } from "./VerifiedField/VerifiedField";

type Field = keyof WhoAmI;

type VerifiedFieldsProps = {
  fields: Field[];
};

/**
 * Get corresponding i18n key from WhoAmI key
 *
 * Ideally these are the same (but TS doesn't know that unfortunately), so just
 * cast it. Logic to manually map fields can go here too.
 * @param field
 */
const getTranslationKeyFromField = (field: Field | string) => {
  return field as Normalize<typeof whoami.field_names>;
};

export const VerifiedFields = ({ fields }: VerifiedFieldsProps) => {
  const { t } = useTranslation("claimForm", { keyPrefix: "verified_by_idp" });
  const { t: tWhoAmIFields } = useTranslation("whoami", {
    keyPrefix: "field_names",
  });
  const whoAmI = useWhoAmI();

  // If we get a response
  if (whoAmI.data) {
    // Get the fields we asked for as components
    const isFieldPopulated = (
      object: { [key: string]: any },
      field: Field | string
    ) =>
      Object.keys(object).includes(field) &&
      object[field] !== null &&
      object[field] !== "";

    const desiredFields = fields
      .filter((field) => isFieldPopulated(whoAmI.data, field))
      .flatMap((desiredField, index) => {
        const value = whoAmI.data[desiredField];
        if (value) {
          if (typeof value === "object" && !Array.isArray(value)) {
            return Object.entries(value)
              .filter(([subField]) => isFieldPopulated(value, subField))
              .map(([subfieldKey, subfieldValue]) => (
                <VerifiedField
                  key={`${index}.${subfieldKey}`}
                  name={tWhoAmIFields(getTranslationKeyFromField(subfieldKey))}
                  value={subfieldValue}
                />
              ));
          } else {
            return (
              <VerifiedField
                key={`${index}.${desiredField}`}
                name={tWhoAmIFields(getTranslationKeyFromField(desiredField))}
                value={value}
              />
            );
          }
        }
      });

    // If the response contained at least one field we were looking for, and we
    // were able to build a component out of it
    if (desiredFields.length > 0) {
      // Render the component with the desired field(s)
      return (
        <div
          data-testid="verified-fields"
          className="usa-summary-box margin-bottom-6"
        >
          <div className="usa-summary-box__body">
            <Logo className={classes.idpLogo} data-testid="idp-logo" />
            <h2 className="usa-summary-box__heading">{t("heading")}</h2>
            <div className="usa-summary-box__text">
              <ul className={classes.fieldList}>{desiredFields}</ul>
              <HelpText>
                {t("to_edit_visit")}{" "}
                <Link href={"https://login.gov"}>{t("idp_url_text")}</Link>
              </HelpText>
            </div>
          </div>
        </div>
      );
    }
  }

  // In the event we do not have a whoami response, or none of the fields we
  // requested are present in the response, return null
  return null;
};
