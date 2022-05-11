import { render, screen, within } from "@testing-library/react";
import states from "../../../fixtures/states.json";
import { StateAbbrev, StatesDropdown } from "./StatesDropdown";
import { Formik } from "formik";
import { noop } from "../../../testUtils/noop";

jest.mock("react-i18next", () => ({
  useTranslation: () => {
    return {
      t: (str: string) => str,
    };
  },
}));

describe("StatesDropdown Component", () => {
  it("renders properly", () => {
    render(
      <Formik initialValues={{}} onSubmit={noop}>
        <StatesDropdown name={"test-name"} label={"test-label"} startEmpty />
      </Formik>
    );

    const statesDropdown = screen.getByLabelText("test-label");
    expect(statesDropdown.children.length).toBe(Object.keys(states).length + 1);
  });

  it("renders a state slice", () => {
    const stateSlice: StateAbbrev[] = ["GA", "CA"];

    render(
      <Formik initialValues={{}} onSubmit={noop}>
        <StatesDropdown
          name={"test-name"}
          label={"test-label"}
          startEmpty
          stateSlice={stateSlice}
        />
      </Formik>
    );

    const statesDropdown = screen.getByLabelText("test-label");
    expect(statesDropdown.children.length).toBe(stateSlice.length + 1);
    expect(within(statesDropdown).getByText("Georgia"));
    expect(within(statesDropdown).getByText("California"));
  });
});
