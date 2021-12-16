import { render } from "@testing-library/react";
import { Formik } from "formik";

import { Address } from "./Address";

jest.mock("react-i18next", () => ({
  useTranslation: () => {
    return {
      t: (str: string) => str,
    };
  },
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
    const stateSlice = ["AL", "WY"];

    const { getByLabelText } = render(
      <Formik initialValues={initialValues} onSubmit={() => undefined}>
        <Address basename={basename} stateSlice={stateSlice} />
      </Formik>
    );

    const address1Field = getByLabelText("label.address1");
    const address2Field = getByLabelText("label.address2");
    const cityField = getByLabelText("label.city");
    const stateField = getByLabelText("label.state");

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
      <Formik initialValues={initialValues} onSubmit={() => undefined}>
        <Address basename={basename} />
      </Formik>
    );

    const address1Field = getByLabelText("label.address1");
    const address2Field = getByLabelText("label.address2");
    const cityField = getByLabelText("label.city");
    const stateField = getByLabelText("label.state");

    expect(address1Field).toHaveValue("123 Main");
    expect(address2Field).toHaveValue("Suite 345");
    expect(cityField).toHaveValue("Somewhere");
    expect(stateField).toHaveValue("TX");
  });
});
