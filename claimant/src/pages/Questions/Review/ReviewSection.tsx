import { PropsWithChildren } from "react";
import { Link } from "react-router-dom";
import reviewStyles from "./Review.module.scss";

interface IReviewSectionProps {
  title: string;
  editPath: string;
}

export const ReviewSection = ({
  title,
  editPath,
  children,
}: PropsWithChildren<IReviewSectionProps>) => (
  <>
    <section className={reviewStyles["review-section"]}>
      <div className={reviewStyles["review-section-header"]}>
        <h2>{title}</h2>
        <Link to={`/claim/${editPath}`} aria-label={`Edit ${title}`}>
          Edit
        </Link>
      </div>
      {children}
    </section>
    <hr />
  </>
);

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
