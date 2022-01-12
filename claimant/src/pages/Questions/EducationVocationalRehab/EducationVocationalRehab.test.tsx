import { render, screen } from "@testing-library/react";
import { Formik } from "formik";
import { noop } from "../../../testUtils/noop";
import { EducationVocationalRehab } from "./EducationVocationalRehab";

jest.mock("react-i18next", () => ({
  useTranslation: () => {
    return {
      t: (str: string) => str,
    };
  },
}));

describe("EducationVocationalRehab component", () => {
  it("renders properly", () => {
    render(
      <Formik initialValues={{}} onSubmit={noop}>
        <EducationVocationalRehab />
      </Formik>
    );

    const legends = [
      "education_vocational_rehab.education.full_time_student.label",
      "education_vocational_rehab.education.attending_training.label",
      "education_vocational_rehab.vocational_rehab.is_registered.label",
    ];

    legends.forEach((legend) => {
      expect(screen.getByText(legend)).toBeInTheDocument();
    });
  });
});
