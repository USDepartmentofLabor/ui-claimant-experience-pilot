import { render, within } from "@testing-library/react";
import { Formik } from "formik";

import { Address } from "./Address";
import { noop } from "../../../testUtils/noop";
import { StateAbbrev } from "../StatesDropdown/StatesDropdown";

jest.mock("react-i18next", () => ({
  useTranslation: () => {
    return {
      t: (str: string) => str,
    };
  },
  Trans: ({ i18nKey }: { i18nKey: string }) => i18nKey,
}));

describe("Address component", () => {
  it("renders inputs for address with state slice", () => {
    const basename = "claimant";
    const initialValues = {
      basename: {
        address1: "",
        address2: "",
        city: "",
        state: "",
        zipcode: "",
      },
    };
    const stateSlice: StateAbbrev[] = ["AL", "WY"];

    const { getByLabelText } = render(
      <Formik initialValues={initialValues} onSubmit={noop}>
        <Address basename={basename} stateSlice={stateSlice} />
      </Formik>
    );

    const address1Field = getByLabelText("address.address1.label");
    const address2Field = getByLabelText("address.address2.label");
    const cityField = getByLabelText("address.city.label");
    const stateField = getByLabelText("address.state.label");

    expect(address1Field).toHaveValue("");
    expect(address1Field).toHaveAttribute("id", `${basename}.address1`);
    expect(address1Field).toHaveAttribute("name", `${basename}.address1`);

    expect(address2Field).toHaveValue("");
    expect(address2Field).toHaveAttribute("id", `${basename}.address2`);
    expect(address2Field).toHaveAttribute("name", `${basename}.address2`);

    expect(cityField).toHaveValue("");
    expect(cityField).toHaveAttribute("id", `${basename}.city`);
    expect(cityField).toHaveAttribute("name", `${basename}.city`);

    expect(stateField).toHaveValue("");
    expect(stateField).toHaveAttribute("id", `${basename}.state`);
    expect(stateField).toHaveAttribute("name", `${basename}.state`);
    expect(stateField.children.length).toBe(stateSlice.length + 1);
    expect(within(stateField).getByText("Alabama"));
    expect(within(stateField).getByText("Wyoming"));
  });

  it("renders all states by default", () => {
    const basename = "claimant";
    const initialValues = {
      claimant: {
        address1: "123 Main",
        address2: "Suite 345",
        city: "Somewhere",
        state: "TX",
        zipcode: "12345",
      },
    };

    const { getByLabelText } = render(
      <Formik initialValues={initialValues} onSubmit={noop}>
        <Address basename={basename} />
      </Formik>
    );

    const address1Field = getByLabelText("address.address1.label");
    const address2Field = getByLabelText("address.address2.label");
    const cityField = getByLabelText("address.city.label");
    const stateField = getByLabelText("address.state.label");

    expect(address1Field).toHaveValue("123 Main");
    expect(address2Field).toHaveValue("Suite 345");
    expect(cityField).toHaveValue("Somewhere");
    expect(stateField).toHaveValue("TX");
  });

  it("renders custom labels", () => {
    const basename = "claimant";
    const initialValues = {
      claimant: {
        address1: "123 Main",
        address2: "Suite 345",
        city: "Somewhere",
        state: "TX",
        zipcode: "12345",
      },
    };
    const myLabels = {
      address1: "first line",
      address2: "second line",
      city: "my city",
      state: "your state",
      zipcode: "POSTAL",
    };

    const { getByLabelText } = render(
      <Formik initialValues={initialValues} onSubmit={noop}>
        <Address basename={basename} labels={myLabels} />
      </Formik>
    );

    const address1Field = getByLabelText("first line");
    const address2Field = getByLabelText("second line");
    const cityField = getByLabelText("my city");
    const stateField = getByLabelText("your state");
    const zipcodeField = getByLabelText("POSTAL");

    expect(address1Field).toHaveValue("123 Main");
    expect(address2Field).toHaveValue("Suite 345");
    expect(cityField).toHaveValue("Somewhere");
    expect(stateField).toHaveValue("TX");
    expect(zipcodeField).toHaveValue("12345");
  });
});
