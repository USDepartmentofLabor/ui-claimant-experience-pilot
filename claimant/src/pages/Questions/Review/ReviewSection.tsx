import { PropsWithChildren } from "react";
import { Link } from "react-router-dom";
import reviewStyles from "./Review.module.scss";
import en from "../../../i18n/en";
import { useTranslation } from "react-i18next";

interface ICustomReviewSectionProps {
  heading: string;
  path: string;
}

export const CustomReviewSection = ({
  heading,
  path,
  children,
}: PropsWithChildren<ICustomReviewSectionProps>) => {
  return (
    <>
      <section className={reviewStyles["review-section"]}>
        <div className={reviewStyles["review-section-header"]}>
          <h2>{heading}</h2>
          <Link to={`/claim/${path}`} aria-label={`Edit ${heading}`}>
            Edit
          </Link>
        </div>
        {children}
      </section>
      <hr aria-hidden="true" />
    </>
  );
};

interface IReviewSectionProps {
  pageDefinition: {
    path: string;
    heading: keyof typeof en.common.page_headings;
  };
}
export const ReviewSection = ({
  pageDefinition,
  children,
}: PropsWithChildren<IReviewSectionProps>) => {
  const { t } = useTranslation("common");
  return (
    <CustomReviewSection
      heading={t(`page_headings.${pageDefinition.heading}`)}
      path={pageDefinition.path}
    >
      {children}
    </CustomReviewSection>
  );
};

interface IReviewElementProps {
  title: string;
  text: string;
}

export const ReviewElement = ({ title, text }: IReviewElementProps) => (
  <p>
    <span>{title}</span>
    {text}
  </p>
);
