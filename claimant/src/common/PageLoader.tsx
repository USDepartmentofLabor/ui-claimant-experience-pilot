import { useTranslation } from "react-i18next";

const PageLoader = () => {
  const { t } = useTranslation("common");
  return <>{t("pageLoader")}</>;
};

export default PageLoader;
