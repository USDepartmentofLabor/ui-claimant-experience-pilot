import { render, waitFor, within } from "@testing-library/react";
import { Formik } from "formik";

import { Availability, AvailabilityPage } from "./Availability";
import { noop } from "../../../testUtils/noop";
import userEvent from "@testing-library/user-event";

jest.mock("react-i18next", () => ({
  useTranslation: () => {
    return {
      t: (str: string) => str,
    };
  },
}));

describe("Availability Component", () => {
  it("Renders properly", () => {
    const { getByRole, getByText } = render(
      <Formik initialValues={AvailabilityPage.initialValues} onSubmit={noop}>
        <Availability />
      </Formik>
    );

    const heading = getByText("heading");
    const canBeginWorkImmediatelyFieldset = getByRole("group", {
      name: "can_begin_work_immediately.label",
    });
    const yesCanBeginWorkImmediately = within(
      canBeginWorkImmediatelyFieldset
    ).getByRole("radio", { name: "yes" });
    const noCanBeginWorkImmediately = within(
      canBeginWorkImmediatelyFieldset
    ).getByRole("radio", { name: "no" });

    const canWorkFullTimeFieldset = getByRole("group", {
      name: "can_work_full_time.label",
    });
    const yesCanWorkFullTime = within(canWorkFullTimeFieldset).getByRole(
      "radio",
      { name: "yes" }
    );
    const noCanWorkFullTime = within(canWorkFullTimeFieldset).getByRole(
      "radio",
      { name: "no" }
    );

    const isPreventedFromAcceptingFullTimeWorkFieldset = getByRole("group", {
      name: "is_prevented_from_accepting_full_time_work.label",
    });
    const yesIsPrecentedFromAcceptingFullTimeWork = within(
      isPreventedFromAcceptingFullTimeWorkFieldset
    ).getByRole("radio", { name: "yes" });
    const noIsPrecentedFromAcceptingFullTimeWork = within(
      isPreventedFromAcceptingFullTimeWorkFieldset
    ).getByRole("radio", { name: "no" });

    expect(heading).toBeInTheDocument();
    expect(yesCanBeginWorkImmediately).toBeInTheDocument();
    expect(canBeginWorkImmediatelyFieldset).toBeInTheDocument();
    expect(noCanBeginWorkImmediately).toBeInTheDocument();
    expect(canWorkFullTimeFieldset).toBeInTheDocument();
    expect(yesCanWorkFullTime).toBeInTheDocument();
    expect(noCanWorkFullTime).toBeInTheDocument();
    expect(isPreventedFromAcceptingFullTimeWorkFieldset).toBeInTheDocument();
    expect(yesIsPrecentedFromAcceptingFullTimeWork).toBeInTheDocument();
    expect(noIsPrecentedFromAcceptingFullTimeWork).toBeInTheDocument();
  });
});
it("hides and shows textfields", async () => {
  const { getByRole } = render(
    <Formik initialValues={AvailabilityPage.initialValues} onSubmit={noop}>
      <Availability />
    </Formik>
  );

  const canBeginWorkImmediatelyFieldset = getByRole("group", {
    name: "can_begin_work_immediately.label",
  });
  const yesCanBeginWorkImmediately = within(
    canBeginWorkImmediatelyFieldset
  ).getByRole("radio", { name: "yes" });
  const noCanBeginWorkImmediately = within(
    canBeginWorkImmediatelyFieldset
  ).getByRole("radio", { name: "no" });

  const canWorkFullTimeFieldset = getByRole("group", {
    name: "can_work_full_time.label",
  });
  const yesCanWorkFullTime = within(canWorkFullTimeFieldset).getByRole(
    "radio",
    { name: "yes" }
  );
  const noCanWorkFullTime = within(canWorkFullTimeFieldset).getByRole("radio", {
    name: "no",
  });

  const isPreventedFromAcceptingFullTimeWorkFieldset = getByRole("group", {
    name: "is_prevented_from_accepting_full_time_work.label",
  });
  const yesIsPrecentedFromAcceptingFullTimeWork = within(
    isPreventedFromAcceptingFullTimeWorkFieldset
  ).getByRole("radio", { name: "yes" });
  const noIsPrecentedFromAcceptingFullTimeWork = within(
    isPreventedFromAcceptingFullTimeWorkFieldset
  ).getByRole("radio", { name: "no" });

  userEvent.click(noCanBeginWorkImmediately);

  await waitFor(() => {
    expect(
      within(canBeginWorkImmediatelyFieldset).queryByLabelText(
        "provide_more_information"
      )
    ).toBeInTheDocument();
  });

  userEvent.click(noCanWorkFullTime);

  await waitFor(() => {
    expect(
      within(canWorkFullTimeFieldset).queryByLabelText(
        "provide_more_information"
      )
    ).toBeInTheDocument();
  });

  userEvent.click(yesIsPrecentedFromAcceptingFullTimeWork);

  await waitFor(() => {
    expect(
      within(isPreventedFromAcceptingFullTimeWorkFieldset).queryByLabelText(
        "provide_more_information"
      )
    ).toBeInTheDocument();
  });

  userEvent.click(yesCanBeginWorkImmediately);

  await waitFor(() => {
    expect(
      within(canBeginWorkImmediatelyFieldset).queryByLabelText(
        "provide_more_information"
      )
    ).not.toBeInTheDocument();
  });

  userEvent.click(yesCanWorkFullTime);

  await waitFor(() => {
    expect(
      within(canWorkFullTimeFieldset).queryByLabelText(
        "provide_more_information"
      )
    ).not.toBeInTheDocument();
  });

  userEvent.click(noIsPrecentedFromAcceptingFullTimeWork);

  await waitFor(() => {
    expect(
      within(isPreventedFromAcceptingFullTimeWorkFieldset).queryByLabelText(
        "provide_more_information"
      )
    ).not.toBeInTheDocument();
  });
});
