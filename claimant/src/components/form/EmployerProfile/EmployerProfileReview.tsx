interface IEmployerReviewProps {
  employer: EmployerType;
}

export const EmployerProfileReview = ({ employer }: IEmployerReviewProps) => {
  return (
    <div className="employer-review margin-bottom-1">
      <span className="text-bold">{employer.name}</span>
    </div>
  );
};
