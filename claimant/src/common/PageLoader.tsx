import { useTranslation } from "react-i18next";

const PageLoader = () => {
  const { t } = useTranslation("common");
  return <div data-testid="page-loading">{t("pageLoader")}</div>;
};

export default PageLoader;
