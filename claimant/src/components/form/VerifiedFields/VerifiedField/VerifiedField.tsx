import { IconCheck } from "@trussworks/react-uswds";
import classes from "./VerifiedField.module.scss";

type VerifiedFieldProps = {
  name: string;
  value: any;
};

export const VerifiedField = ({ name, value }: VerifiedFieldProps) => (
  <li className={classes.field}>
    <div>{name}</div>
    <div className={classes.fieldValue}>
      <IconCheck
        data-testid="check-icon"
        className={`text-info-dark ${classes.icon}`}
        size={3}
        aria-hidden="true"
      />{" "}
      <span className={classes.text}>{value}</span>
    </div>
  </li>
);
