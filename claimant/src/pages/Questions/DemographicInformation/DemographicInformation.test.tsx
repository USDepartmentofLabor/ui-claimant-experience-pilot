import { act, render } from "@testing-library/react";
import { Formik } from "formik";
import { screen } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";

import { DemographicInformation } from "./DemographicInformation";
import claimForm from "../../../i18n/en/claimForm";
import { noop } from "../../../testUtils/noop";

jest.mock("react-i18next", () => ({
  useTranslation: () => {
    return {
      t: (str: string) => str,
    };
  },
}));

describe("DemographicInformation component", () => {
  const initialValues = {
    sex: undefined,
    race: [],
    ethnicity: undefined,
    education_level: undefined,
  };

  it("renders properly", () => {
    const { getByLabelText } = render(
      <Formik initialValues={initialValues} onSubmit={noop}>
        <DemographicInformation />
      </Formik>
    );

    Object.keys(claimForm.sex.options).map((option) => {
      const sexRadio = screen.getByRole("radio", {
        name: `sex.options.${option}`,
      });
      expect(sexRadio).not.toBeChecked();
    });

    Object.keys(claimForm.race.options).map((race) => {
      const raceCheckbox = getByLabelText(`race.options.${race}`);
      expect(raceCheckbox).not.toBeChecked();
      expect(raceCheckbox).toHaveAttribute("id", `race.${race}`);
      expect(raceCheckbox).toHaveAttribute("name", "race");
    });

    Object.keys(claimForm.ethnicity.options).map((ethnicity) => {
      const ethnicityRadio = getByLabelText(`ethnicity.options.${ethnicity}`);
      expect(ethnicityRadio).not.toBeChecked();
      expect(ethnicityRadio).toHaveAttribute("id", `ethnicity.${ethnicity}`);
      expect(ethnicityRadio).toHaveAttribute("name", "ethnicity");
    });

    getByLabelText(`education_level.label`);
    Object.keys(claimForm.education_level.options).map((educationLevel) => {
      screen.getByText(`education_level.options.${educationLevel}`);
    });
  });

  describe("sex", () => {
    it("Can check one radio button at a time", async () => {
      render(
        <Formik initialValues={initialValues} onSubmit={noop}>
          <DemographicInformation />
        </Formik>
      );
      const radio1 = screen.getByLabelText("sex.options.female");
      const radio2 = screen.getByLabelText("sex.options.male");
      expect(radio1).not.toBeChecked();
      await act(async () => {
        userEvent.click(radio1);
      });
      expect(radio1).toBeChecked();
      await act(async () => {
        userEvent.click(radio2);
      });
      expect(radio2).toBeChecked();
      expect(radio1).not.toBeChecked();
    });
  });

  describe("race", () => {
    it("Allows selection of multiple races", async () => {
      const { getByLabelText } = render(
        <Formik initialValues={initialValues} onSubmit={noop}>
          <DemographicInformation />
        </Formik>
      );

      const asian = getByLabelText("race.options.asian");
      const hawaiianPI = getByLabelText(
        "race.options.hawaiian_or_pacific_islander"
      );
      const black = getByLabelText("race.options.black");
      const white = getByLabelText("race.options.white");

      // Checkboxes start unchecked
      expect(asian).not.toBeChecked();
      expect(hawaiianPI).not.toBeChecked();
      expect(black).not.toBeChecked();
      expect(white).not.toBeChecked();

      // User checks a subset
      await act(async () => {
        await userEvent.click(asian);
        userEvent.click(hawaiianPI);
      });

      // The checkboxes that the user clicked on are checked
      expect(asian).toBeChecked();
      expect(hawaiianPI).toBeChecked();

      // The checkboxes *not* clicked on remain unchecked
      expect(black).not.toBeChecked();
      expect(white).not.toBeChecked();
    });
  });

  describe("ethnicity", () => {
    it("Allows selection of ethnicity", async () => {
      render(
        <Formik initialValues={initialValues} onSubmit={noop}>
          <DemographicInformation />
        </Formik>
      );

      const radio1 = screen.getByLabelText("ethnicity.options.opt_out");
      const radio3 = screen.getByLabelText("ethnicity.options.not_hispanic");
      expect(radio1).not.toBeChecked();
      await act(async () => {
        userEvent.click(radio1);
      });
      expect(radio1).toBeChecked();
      await act(async () => {
        userEvent.click(radio3);
      });
      expect(radio3).toBeChecked();
      expect(radio1).not.toBeChecked();
    });
  });

  describe("education level", () => {
    it("Allows selection of an education level", async () => {
      render(
        <Formik initialValues={initialValues} onSubmit={noop}>
          <DemographicInformation />
        </Formik>
      );

      const educationLevelDropdown = screen.getByLabelText(
        "education_level.label"
      );
      expect(educationLevelDropdown).toHaveValue("");

      await act(async () => {
        await userEvent.click(educationLevelDropdown);
        await userEvent.selectOptions(educationLevelDropdown, "none");
      });
      expect(educationLevelDropdown).toHaveValue("none");

      await act(async () => {
        userEvent.selectOptions(educationLevelDropdown, "grade_12");
      });
      expect(educationLevelDropdown).toHaveValue("grade_12");
      expect(educationLevelDropdown).not.toHaveValue("none");
    });
  });
});
