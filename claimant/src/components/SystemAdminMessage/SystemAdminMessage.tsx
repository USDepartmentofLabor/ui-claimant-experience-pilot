import { ComponentProps } from "react";
import { SiteAlert } from "@trussworks/react-uswds";

type SiteAlertProps = ComponentProps<typeof SiteAlert>;

type SystemAdminMessageProps = Omit<SiteAlertProps, "variant"> & {
  // Define variant as an optional version of the USWDS implementation
  // since we're giving it a default value in this implementation
  variant?: SiteAlertProps["variant"];
};

// TODO: Be able to display custom messages in multiple languages
//  (e.g. through Language detection and a corresponding LD flag, if set)
export const SystemAdminMessage = ({
  children,
  variant = "info",
  ...siteAlertProps
}: SystemAdminMessageProps) => {
  return (
    <SiteAlert variant={variant} {...siteAlertProps} data-testid="site-alert">
      {children}
    </SiteAlert>
  );
};
