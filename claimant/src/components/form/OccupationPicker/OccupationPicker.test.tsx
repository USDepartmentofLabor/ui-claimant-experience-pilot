import { render, waitFor, act, screen } from "@testing-library/react";
import { Formik, Form } from "formik";
import { OccupationPicker } from "./OccupationPicker";
import userEvent from "@testing-library/user-event";
import { noop } from "../../../testUtils/noop";
import { Button } from "@trussworks/react-uswds";

jest.mock("react-i18next", () => ({
  useTranslation: () => {
    return {
      t: (str: string) => str,
    };
  },
}));

const defaultInitialValues = {
  occupation: {
    job_title: "",
  },
};

const nurseInitialValues = {
  occupation: {
    job_title: "nurse",
    job_description: "ER nurse",
    bls_description:
      'Assess patient health problems and needs, develop and implement nursing care plans, and maintain medical records. Administer nursing care to ill, injured, convalescent, or disabled patients. May advise patients on health maintenance and disease prevention or provide case management. Licensing or registration required. Includes Clinical Nurse Specialists. Excludes "Nurse Anesthetists" (29-1151), "Nurse Midwives" (29-1161), and "Nurse Practitioners" (29-1171).',
    bls_code: "29-1141.00",
    bls_title: "Registered Nurses",
  },
};

describe("OccupationPicker component", () => {
  it("renders properly", async () => {
    // we must wrap the render inside act() because it does a setState
    await act(async () => {
      render(
        <Formik initialValues={defaultInitialValues} onSubmit={noop}>
          <OccupationPicker />
        </Formik>
      );
    });
    const jobTitle = screen.getByLabelText("what_is_your_occupation.label");
    const jobDescription = screen.getByLabelText("short_description.label");
    expect(jobTitle).toBeInTheDocument();
    expect(jobDescription).toBeInTheDocument();
    expect(jobTitle).toHaveValue("");
    expect(jobDescription).toHaveValue("");
  });

  it("renders existing values", async () => {
    await act(async () => {
      render(
        <Formik initialValues={nurseInitialValues} onSubmit={noop}>
          <OccupationPicker />
        </Formik>
      );
    });
    const jobTitle = screen.getByLabelText("what_is_your_occupation.label");
    const jobDescription = screen.getByLabelText("short_description.label");
    const selectedBlsCode = screen.getByTestId(
      "occupation.bls_code.29-1141.00"
    );
    const matchingBlsCodes = screen.getAllByRole("radio");
    expect(jobTitle).toHaveValue("nurse");
    expect(jobDescription).toHaveValue("ER nurse");
    expect(selectedBlsCode).toHaveAttribute(
      "id",
      "occupation.bls_code.29-1141.00"
    );
    expect(selectedBlsCode).toBeChecked();
    expect(matchingBlsCodes.length).toEqual(12);
    matchingBlsCodes.forEach((radio) => {
      expect(radio).toHaveAttribute("name", "occupation.bls_code");
    });
  });

  it("populates bls attributes based on code selection", async () => {
    const expectedValues = {
      occupation: {
        job_title: "nurse",
        job_description: "ER nurse",
        bls_description:
          "Administer anesthesia, monitor patient's vital signs, and oversee patient recovery from anesthesia. May assist anesthesiologists, surgeons, other physicians, or dentists. Must be registered nurses who have specialized graduate education.",
        bls_code: "29-1151.00",
        bls_title: "Nurse Anesthetists",
      },
    };
    let submittedValues = {};
    const handleSubmit = jest.fn((values) => (submittedValues = values));

    await act(async () => {
      render(
        <Formik initialValues={nurseInitialValues} onSubmit={handleSubmit}>
          <Form>
            <OccupationPicker />
            <Button type="submit">Submit</Button>
          </Form>
        </Formik>
      );
    });

    const jobTitle = screen.getByLabelText("what_is_your_occupation.label");
    expect(jobTitle).toHaveValue("nurse");
    const alternateBlsCode = screen.getByTestId(
      "occupation.bls_code.29-1151.00"
    );
    expect(alternateBlsCode).not.toBeChecked();

    await act(async () => {
      userEvent.click(alternateBlsCode);
    });
    expect(alternateBlsCode).toBeChecked();

    const submit = screen.getByRole("button", { name: "Submit" });
    userEvent.click(submit);
    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalled();
      expect(submittedValues).toEqual(expectedValues);
    });
  });

  it("searches SOC entries for matching text", async () => {
    await act(async () => {
      render(
        <Formik initialValues={defaultInitialValues} onSubmit={noop}>
          <OccupationPicker />
        </Formik>
      );
    });

    const jobTitle = screen.getByLabelText("what_is_your_occupation.label");
    await act(async () => {
      // must clear first -- this is a hack, unsure why necessary
      await userEvent.clear(jobTitle);
      userEvent.type(jobTitle, "software designer");
    });
    const matchingBlsCodes = await screen.findAllByRole("radio");
    expect(matchingBlsCodes.length).toEqual(30);
  });

  it("Displays error-like message if there are zero search results", async () => {
    await act(async () => {
      render(
        <Formik initialValues={defaultInitialValues} onSubmit={noop}>
          <OccupationPicker />
        </Formik>
      );
    });

    const jobTitle = screen.getByLabelText("what_is_your_occupation.label");
    await act(async () => {
      // must clear first -- this is a hack, unsure why necessary
      await userEvent.clear(jobTitle);
      userEvent.type(jobTitle, "asdfasdf");
    });
    const noResultsMessage = await screen.getByText("no_results");
    expect(noResultsMessage).toBeInTheDocument();
  });
});
