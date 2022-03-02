import { ReactNode, RefObject, useEffect } from "react";
import { useLocation } from "react-router";
import { useTranslation } from "react-i18next";

type scrollProps = {
  children: ReactNode;
  pageTitle?: string;
  headingRef?: RefObject<HTMLHeadingElement>;
};
const ScrollToTop = ({ children, pageTitle, headingRef }: scrollProps) => {
  const { pathname } = useLocation();
  const { t } = useTranslation("common");

  useEffect(() => {
    document.title = `${pageTitle} | ${t("form_title")}`;
    window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
    headingRef?.current?.focus();
  }, [pathname]);

  return <div>{children}</div>;
};

export default ScrollToTop;
