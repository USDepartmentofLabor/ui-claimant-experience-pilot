import React, { ReactNode, ReactNodeArray } from "react";
//import classnames from "classnames";

type FieldGroupProps = {
  children: ReactNode | ReactNodeArray;
  className?: string;
  error?: boolean;
  scrollElement?: string;
} & JSX.IntrinsicElements["div"];

const FieldGroup = ({
  children,
  className,
  error,
  scrollElement,
  ...props
}: FieldGroupProps) => {
  /*
  const fieldGroupClasses = classnames(
    "usa-form-group",
    { "usa-form-group--error": error },
    className
  );
  */
  const fieldGroupClasses = "usa-form-group";
  return (
    <div className={fieldGroupClasses} data-scroll={scrollElement} {...props}>
      {children}
    </div>
  );
};

export default FieldGroup;
