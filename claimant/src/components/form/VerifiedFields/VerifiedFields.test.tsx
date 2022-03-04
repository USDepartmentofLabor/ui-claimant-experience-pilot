import { render, screen, within } from "@testing-library/react";
import { VerifiedFields } from "./VerifiedFields";
import { useWhoAmI } from "../../../queries/whoami";

jest.mock("react-i18next", () => ({
  useTranslation: () => {
    return {
      t: (str: string) => str,
    };
  },
}));

jest.mock("../../../queries/whoami");
const mockedUseWhoAmI = useWhoAmI as any;

describe("VerifiedFields Component", () => {
  mockedUseWhoAmI.mockImplementation(() => ({
    data: {
      email: "test@test.com",
      phone: "(123)-456-7890",
      address: {
        address1: "123 Test St",
        address2: "",
        city: "Testersville",
        state: "TN",
        zipcode: "54321",
      },
    },
    isLoading: false,
    error: null,
    isError: false,
    isSuccess: true,
  }));

  it("renders without error", () => {
    render(<VerifiedFields fields={["email", "phone"]} />);

    const idpLogo = screen.getByTestId("idp-logo");
    const heading = screen.getByRole("heading");

    const emailField = screen.getByText("email");
    const emailValue = screen.getByText("test@test.com");

    const phoneField = screen.getByText("phone");
    const phoneValue = screen.getByText("(123)-456-7890");

    const checkIcons = screen.getAllByTestId("check-icon");

    const helpText = screen.getByText("to_edit_visit");
    const idpLink = within(helpText).getByRole("link");

    expect(idpLogo).toBeInTheDocument();
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveTextContent("heading");

    expect(emailField).toBeInTheDocument();
    expect(emailValue).toBeInTheDocument();

    expect(phoneField).toBeInTheDocument();
    expect(phoneValue).toBeInTheDocument();

    expect(checkIcons).toHaveLength(2);
    checkIcons.forEach((checkIcon) => {
      expect(checkIcon).toHaveClass("text-info-dark");
      expect(checkIcon).toHaveAttribute("aria-hidden", "true");
    });

    expect(helpText).toBeInTheDocument();
    expect(idpLink).toBeInTheDocument();
    expect(idpLink).toHaveTextContent("idp_url_text");
    expect(idpLink).toHaveAttribute("href", "https://login.gov");
  });

  it("renders objects", () => {
    render(<VerifiedFields fields={["address"]} />);

    const address1Field = screen.getByText("address1");
    const address1Value = screen.getByText("123 Test St");

    const address2Field = screen.queryByText("address2");

    const cityField = screen.getByText("city");
    const cityValue = screen.getByText("Testersville");

    const stateField = screen.getByText("state");
    const stateValue = screen.getByText("TN");

    const zipcodeField = screen.getByText("zipcode");
    const zipcodeValue = screen.getByText("54321");

    expect(address1Field).toBeInTheDocument();
    expect(address1Value).toBeInTheDocument();
    expect(address2Field).not.toBeInTheDocument();
    expect(cityField).toBeInTheDocument();
    expect(cityValue).toBeInTheDocument();
    expect(stateField).toBeInTheDocument();
    expect(stateValue).toBeInTheDocument();
    expect(zipcodeField).toBeInTheDocument();
    expect(zipcodeValue).toBeInTheDocument();
  });

  it("does not render empty, null, or undefined fields, or fields we did not ask for", () => {
    mockedUseWhoAmI.mockImplementationOnce(() => ({
      data: {
        first_name: "",
        last_name: undefined,
        phone: null,
        email: "test@test.com",
        address: {
          address1: "123 Test St",
          address2: "",
          city: "Testersville",
          state: "TN",
          zipcode: "54321",
        },
      },
      isLoading: false,
      error: null,
      isError: false,
      isSuccess: true,
    }));

    render(
      <VerifiedFields
        fields={["first_name", "last_name", "phone", "address"]}
      />
    );

    const firstNameField = screen.queryByText("first_name");
    const lastNameField = screen.queryByText("last_name");
    const phoneField = screen.queryByText("phone");

    const emailField = screen.queryByText("email");
    const emailValue = screen.queryByText("test@test.com");

    const address1Field = screen.getByText("address1");
    const address1Value = screen.getByText("123 Test St");

    const address2Field = screen.queryByText("address2");

    const cityField = screen.getByText("city");
    const cityValue = screen.getByText("Testersville");

    const stateField = screen.getByText("state");
    const stateValue = screen.getByText("TN");

    const zipcodeField = screen.getByText("zipcode");
    const zipcodeValue = screen.getByText("54321");

    expect(firstNameField).not.toBeInTheDocument();
    expect(lastNameField).not.toBeInTheDocument();
    expect(phoneField).not.toBeInTheDocument();
    expect(emailField).not.toBeInTheDocument();
    expect(emailValue).not.toBeInTheDocument();

    expect(address1Field).toBeInTheDocument();
    expect(address1Value).toBeInTheDocument();
    expect(address2Field).not.toBeInTheDocument();
    expect(cityField).toBeInTheDocument();
    expect(cityValue).toBeInTheDocument();
    expect(stateField).toBeInTheDocument();
    expect(stateValue).toBeInTheDocument();
    expect(zipcodeField).toBeInTheDocument();
    expect(zipcodeValue).toBeInTheDocument();
  });

  it("Does not render a component if the only desired field(s) is/are empty", () => {
    mockedUseWhoAmI.mockImplementationOnce(() => ({
      data: {
        first_name: "",
        last_name: "",
        address: {
          address1: "",
          address2: "",
          city: "",
          state: "",
          zipcode: "",
        },
      },
      isLoading: false,
      error: null,
      isError: false,
      isSuccess: true,
    }));

    render(
      <VerifiedFields
        fields={["first_name", "last_name", "phone", "address"]}
      />
    );

    const verifiedFields = screen.queryByTestId("verified-fields");

    expect(verifiedFields).not.toBeInTheDocument();
  });

  it("masks the ssn", () => {
    mockedUseWhoAmI.mockImplementationOnce(() => ({
      data: {
        ssn: "123-45-6789",
      },
      isLoading: false,
      error: null,
      isError: false,
      isSuccess: true,
    }));

    render(<VerifiedFields fields={["ssn"]} />);

    const ssnField = screen.getByText("ssn");
    const ssnValue = screen.getByText("***-**-6789");

    expect(ssnField).toBeInTheDocument();
    expect(ssnValue).toBeInTheDocument();
  });
});
