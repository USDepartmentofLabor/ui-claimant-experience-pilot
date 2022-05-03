import { render } from "@testing-library/react";
import { Formik } from "formik";

import { PhoneNumberField } from "./PhoneNumberField";

jest.mock("react-i18next", () => ({
  useTranslation: () => {
    return {
      t: (str: string) => str,
    };
  },
  Trans: ({ i18nKey }: { i18nKey: string }) => i18nKey,
}));

describe("Phone number component", () => {
  it("renders inputs for phone number", () => {
    const basename = "test-phone";
    const initialValues = {
      [basename]: {
        number: "",
        type: "",
        sms: true,
      },
    };

    const { getByLabelText } = render(
      <Formik initialValues={initialValues} onSubmit={() => undefined}>
        <PhoneNumberField name={basename} />
      </Formik>
    );

    const numberField = getByLabelText("phone.number.label");
    const typeField = getByLabelText("phone.type.label");
    const smsCheckbox = getByLabelText("phone.sms.label");

    expect(numberField).toHaveValue("");
    expect(numberField).toHaveAttribute("id", `${basename}.number`);
    expect(numberField).toHaveAttribute("name", `${basename}.number`);

    expect(typeField).toHaveValue("");
    expect(typeField).toHaveAttribute("id", `${basename}.type`);
    expect(typeField).toHaveAttribute("name", `${basename}.type`);

    expect(smsCheckbox).toBeChecked();
    expect(smsCheckbox).toHaveAttribute("id", `${basename}.sms`);
    expect(smsCheckbox).toHaveAttribute("name", `${basename}.sms`);
  });
});
