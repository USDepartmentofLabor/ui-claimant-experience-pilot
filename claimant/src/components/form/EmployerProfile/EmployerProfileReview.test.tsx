import { render } from "@testing-library/react";
import { EmployerProfileReview } from "./EmployerProfileReview";

jest.mock("react-i18next", () => ({
  useTranslation: () => {
    return {
      t: (str: string) => str,
    };
  },
}));

describe("EmployerProfileReview component", () => {
  const employer = {
    name: "ACME",
    separation_comment: "",
    separation_reason: "laid_off",
    separation_option: "lack_of_work",
    last_work_date: "2022-01-02",
    first_work_date: "2022-01-02",
    LOCAL_same_address: true,
    LOCAL_same_phone: true,
    phones: [{ number: "555-555-5555" }],
    address: {
      address1: "123 Main St",
      city: "Somewhere",
      state: "NJ",
      zipcode: "12345",
    },
  };

  it("renders properly", () => {
    const { getByText } = render(<EmployerProfileReview employer={employer} />);

    const cityStateZIP = getByText("Somewhere, NJ, 12345");
    expect(cityStateZIP).toBeInTheDocument();
  });
});
