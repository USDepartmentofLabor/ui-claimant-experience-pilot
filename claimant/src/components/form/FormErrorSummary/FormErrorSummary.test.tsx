import { render, screen } from "@testing-library/react";
import { FormikErrors } from "formik";
import { FormErrorSummary } from "./FormErrorSummary";

jest.mock("react-i18next", () => ({
  useTranslation: () => {
    return {
      t: (str: string, params: { count: number }) => `${str} ${params.count}`,
    };
  },
}));

describe("FormErrorSummary", () => {
  it("shows the correct number of errors for a simple error object", () => {
    const errors = {
      name: "should have a name",
      email: "should have an email",
    };
    render(<FormErrorSummary errors={errors} />);
    expect(screen.getByText("validation_alert 2")).toBeInTheDocument();
  });
  it("shows the correct number of errors for a complex error object", () => {
    const errors: FormikErrors<object> = {
      name: "should have a name",
      email: "should have an email",
      employers: [
        {
          name: "should have a name",
          dates: {
            start_date: "start date incorrect",
            end_date: "end date incorrect",
          },
        },
      ],
    };
    render(<FormErrorSummary errors={errors} />);
    expect(screen.getByText("validation_alert 5")).toBeInTheDocument();
  });
});
