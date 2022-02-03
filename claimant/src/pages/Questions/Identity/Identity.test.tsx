import { Identity, IdentityPage } from "./Identity";
import { screen, render, waitFor, within } from "@testing-library/react";
import { Formik } from "formik";
import { noop } from "../../../testUtils/noop";
import userEvent from "@testing-library/user-event";

jest.mock("react-i18next", () => ({
  useTranslation: () => {
    return {
      t: (str: string) => str,
    };
  },
}));

describe("Identity Information Page", () => {
  it("renders properly", () => {
    render(
      <Formik initialValues={IdentityPage.initialValues} onSubmit={noop}>
        <Identity />
      </Formik>
    );

    const socialSecurityNumber = screen.queryByLabelText("ssn.label");
    const dateOfBirthLabel = screen.getByText("birthdate.label");
    const dateOfBirthFields = screen.getByTestId("birthdate.parent-div");
    const dateOfBirthMonth =
      within(dateOfBirthFields).queryByLabelText("date.month.label");
    const dateOfBirthDay =
      within(dateOfBirthFields).queryByLabelText("date.day.label");
    const dateOfBirthYear =
      within(dateOfBirthFields).queryByLabelText("date.year.label");
    const idNumber = screen.queryByLabelText(
      "state_credential.drivers_license_or_state_id_number.label"
    );

    const stateDropdown = screen.queryByLabelText(
      "state_credential.issuer.label"
    );

    const authorizedToWorkInUSRadioGroup = screen.getByRole("group", {
      name: "work_authorization.authorized_to_work.label",
    });
    const yesAuthorizedToWorkInUS = within(
      authorizedToWorkInUSRadioGroup
    ).queryByLabelText("yes");
    const noAuthorizedToWorkInUS = within(
      authorizedToWorkInUSRadioGroup
    ).queryByLabelText("no");

    const alienRegistrationTypeDropdown = screen.getByLabelText(
      "work_authorization.authorization_type.label"
    );
    const usCitizenOption = within(alienRegistrationTypeDropdown).queryByText(
      "work_authorization.authorization_type.options.US_citizen_or_national"
    );
    const permanentResidentOption = within(
      alienRegistrationTypeDropdown
    ).queryByText(
      "work_authorization.authorization_type.options.permanent_resident"
    );
    const temporaryLegalWorkerOption = within(
      alienRegistrationTypeDropdown
    ).queryByText(
      "work_authorization.authorization_type.options.temporary_legal_worker"
    );

    expect(socialSecurityNumber).toBeInTheDocument();
    expect(socialSecurityNumber).toBeDisabled();

    expect(dateOfBirthLabel).toBeInTheDocument();
    expect(dateOfBirthMonth).toBeInTheDocument();
    expect(dateOfBirthMonth).toBeDisabled();

    expect(dateOfBirthDay).toBeInTheDocument();
    expect(dateOfBirthDay).toBeDisabled();

    expect(dateOfBirthYear).toBeInTheDocument();
    expect(dateOfBirthYear).toBeDisabled();

    expect(idNumber).toBeInTheDocument();
    expect(stateDropdown).toBeInTheDocument();
    expect(yesAuthorizedToWorkInUS).toBeInTheDocument();
    expect(noAuthorizedToWorkInUS).toBeInTheDocument();
    expect(usCitizenOption).toBeInTheDocument();
    expect(permanentResidentOption).toBeInTheDocument();
    expect(temporaryLegalWorkerOption).toBeInTheDocument();
  });

  it("hides and shows explanation field", async () => {
    render(
      <Formik initialValues={IdentityPage.initialValues} onSubmit={noop}>
        <Identity />
      </Formik>
    );

    const authorizedToWorkInUSRadioGroup = screen.getByRole("group", {
      name: "work_authorization.authorized_to_work.label",
    });
    const yesAuthorizedToWorkInUS = within(
      authorizedToWorkInUSRadioGroup
    ).getByLabelText("yes");
    const noAuthorizedToWorkInUS = within(
      authorizedToWorkInUSRadioGroup
    ).getByLabelText("no");

    expect(yesAuthorizedToWorkInUS).toBeInTheDocument();
    expect(noAuthorizedToWorkInUS).toBeInTheDocument();
    // Field is hidden
    expect(
      screen.queryByLabelText(
        "work_authorization.not_authorized_to_work_explanation.label"
      )
    ).not.toBeInTheDocument();

    // Toggle field to show up
    userEvent.click(noAuthorizedToWorkInUS);
    const notAllowedToWorkInUSExplanationField = await screen.findByLabelText(
      "work_authorization.not_authorized_to_work_explanation.label"
    );
    expect(notAllowedToWorkInUSExplanationField).toBeInTheDocument();

    // Toggle field to hidden
    userEvent.click(yesAuthorizedToWorkInUS);
    await waitFor(() => {
      expect(notAllowedToWorkInUSExplanationField).not.toBeInTheDocument();
    });
  });

  it("hides and shows alien registration number field", async () => {
    render(
      <Formik initialValues={IdentityPage.initialValues} onSubmit={noop}>
        <Identity />
      </Formik>
    );

    const alienRegistrationTypeDropdown = screen.getByLabelText(
      "work_authorization.authorization_type.label"
    );
    const usCitizenOption = within(alienRegistrationTypeDropdown).getByText(
      "work_authorization.authorization_type.options.US_citizen_or_national"
    );
    const permanentResidentOption = within(
      alienRegistrationTypeDropdown
    ).getByText(
      "work_authorization.authorization_type.options.permanent_resident"
    );
    const temporaryLegalWorkerOption = within(
      alienRegistrationTypeDropdown
    ).getByText(
      "work_authorization.authorization_type.options.temporary_legal_worker"
    );

    // Field is hidden
    expect(
      screen.queryByLabelText(
        "work_authorization.alien_registration_number.label"
      )
    ).not.toBeInTheDocument();

    // Toggle field to show up
    userEvent.selectOptions(
      alienRegistrationTypeDropdown,
      permanentResidentOption
    );
    const alienRegistrationNumberField = await screen.findByLabelText(
      "work_authorization.alien_registration_number.label"
    );
    expect(alienRegistrationNumberField).toBeInTheDocument();

    // Field stays shown for this option
    userEvent.selectOptions(
      alienRegistrationTypeDropdown,
      temporaryLegalWorkerOption
    );
    expect(alienRegistrationNumberField).toBeInTheDocument();

    // Toggle field to hidden
    userEvent.selectOptions(alienRegistrationTypeDropdown, usCitizenOption);
    await waitFor(() => {
      expect(alienRegistrationNumberField).not.toBeInTheDocument();
    });
  });
});
