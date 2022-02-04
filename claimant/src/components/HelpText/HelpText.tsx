import React, { ReactNode } from "react";
import classnames from "classnames";

type HelpTextProps = {
  id?: string;
  children: ReactNode;
  className?: string;
  withLeftBorder?: boolean;
};

const HelpText = ({
  id,
  children,
  className,
  withLeftBorder,
}: HelpTextProps) => {
  const classNames = classnames(
    "font-body-xs line-height-body-2 text-base-darker display-inline-block margin-top-2",
    { "border-left-05 border-base-lighter padding-left-1": withLeftBorder },
    className
  );
  return (
    <div id={id} className={classNames}>
      {children}
    </div>
  );
};

export default HelpText;
