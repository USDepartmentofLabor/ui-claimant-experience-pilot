import HelpText from "../../HelpText/HelpText";
import { Link } from "@trussworks/react-uswds";
import classes from "./VerifiedFields.module.scss";
import { ReactComponent as Logo } from "../../../images/logindotgov/login-gov-logo.svg";
import { Normalize, useTranslation } from "react-i18next";
import { useWhoAmI } from "../../../queries/whoami";
import whoami from "../../../i18n/en/whoami";
import { VerifiedField } from "./VerifiedField/VerifiedField";
import { ReactElement } from "react";

type Field = keyof WhoAmI;

type VerifiedFieldsProps = {
  fields: Field[];
};

const isFieldPopulated = <O extends { [key: string]: any }>(
  object: O,
  field: keyof O
) =>
  field in object &&
  object[field] !== undefined &&
  object[field] !== null &&
  object[field] !== "";

const maskingFunctions = {
  ssn: (ssn: string) => `***-**-${ssn.substring(ssn.length - 4)}`,
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

    const extractFieldsAsComponents = <O extends { [key: string]: any }>(
      object: O,
      desiredFields: (keyof O)[]
    ): ReactElement[] =>
      desiredFields
        .filter((field) => isFieldPopulated(object, field))
        .flatMap((desiredField, index) => {
          const value = object[desiredField];
          if (typeof value === "object" && !Array.isArray(value)) {
            return extractFieldsAsComponents(value, Object.keys(value));
          }
          return (
            <VerifiedField
              key={`${index}.${desiredField}`}
              name={tWhoAmIFields(
                desiredField as Normalize<typeof whoami.field_names>
              )}
              value={
                desiredField in maskingFunctions
                  ? maskingFunctions[
                      desiredField as keyof typeof maskingFunctions
                    ](value)
                  : value
              }
            />
          );
        });

    const fieldsToDisplay = extractFieldsAsComponents(whoAmI.data, fields);

    // If the response contained at least one field we were looking for, and we
    // were able to build a component out of it
    if (fieldsToDisplay.length > 0) {
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
              <ul className={classes.fieldList}>{fieldsToDisplay}</ul>
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
