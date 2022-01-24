import { ComponentMeta, ComponentStory } from "@storybook/react";
import { Form, Formik } from "formik";
import { Fieldset, Label } from "@trussworks/react-uswds";
import * as yup from "yup";
import { DateInputField } from "./DateInputField";
import { noop } from "../../../../testUtils/noop";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import {
  ISO_8601_DATE,
  USER_FACING_DATE_INPUT_FORMAT,
} from "../../../../utils/format";

export default {
  title: "Components/Form/Fields/Date Input Field",
  component: DateInputField,
} as ComponentMeta<typeof DateInputField>;

const WithFormikValueTemplate: ComponentStory<typeof DateInputField> = (
  args
) => {
  const initialValues = {
    [args.name]: "",
  };

  const validationSchema = yup.object().shape({
    [args.name]: yup
      .date()
      .transform((value, originalValue) => {
        dayjs.extend(customParseFormat);
        return dayjs(originalValue, ISO_8601_DATE, true).isValid()
          ? value
          : yup.date.INVALID_DATE;
      })
      .typeError(
        `${args.name} must be a valid date with format ${USER_FACING_DATE_INPUT_FORMAT}`
      )
      .required(),
  });

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={validationSchema}
      onSubmit={noop}
    >
      {(props) => (
        <Form>
          <Fieldset legend="Type a date below">
            <DateInputField {...args} />
          </Fieldset>
          <Label htmlFor={"formik_value"}>Formik Value:</Label>
          <span id="formik_value">{props.values[args.name]}</span>
        </Form>
      )}
    </Formik>
  );
};

export const ShowFormikValue = WithFormikValueTemplate.bind({});
ShowFormikValue.args = {
  id: "example_date",
  name: "example_date",
  hint: "The ISO8601 value formik handles will be displayed below in real time",
};
