import { render, screen, within } from "@testing-library/react";
import { Formik } from "formik";
import { Normalize } from "react-i18next";
import { MemoryRouter } from "react-router";
import claimForm from "../../../i18n/en/claimForm";
import contact from "../../../i18n/en/contact";
import { noop } from "../../../testUtils/noop";
import { Review } from "./Review";

jest.mock("react-i18next", () => ({
  useTranslation: () => {
    return {
      t: (str: string) => str,
    };
  },
}));

const data: Claim = {
  swa_code: "XX",
  claimant_id: "123",
  claimant_name: {
    first_name: "Clark",
    middle_name: "Joseph",
    last_name: "Kent",
  },
  alternate_names: [
    {
      first_name: "Super",
      middle_name: "Frank",
      last_name: "Man",
    },
  ],
  mailing_address: {
    address1: "123 Fake St",
    address2: "Apt 3",
    city: "Fakeville",
    state: "NJ",
    zipcode: "12356",
  },
  residence_address: {
    address1: "Fortress",
    address2: "Of Solitude",
    city: "Nowhere",
    state: "AK",
    zipcode: "99999",
  },
  LOCAL_claimant_has_alternate_names: true,
  LOCAL_mailing_address_same: false,
};

type TranslationKey = Normalize<typeof claimForm> | Normalize<typeof contact>;

const asYesNo = (input: boolean | undefined) => (input ? "yes" : "no");

describe("Review Page", () => {
  beforeEach(() => {
    render(
      <MemoryRouter>
        <Formik initialValues={data} onSubmit={noop}>
          <Review />
        </Formik>
      </MemoryRouter>
    );
  });

  it("renders all attributes", () => {
    // Personal info
    const personalSection = screen
      .getByText("page_headings.personal")
      .closest("section");
    if (personalSection === null) throw new Error("Section not found");
    const expectedContents: [TranslationKey, number, any][] = [
      ["name.first_name.label", 0, data.claimant_name?.first_name],
      ["name.middle_name.label", 0, data.claimant_name?.middle_name],
      ["name.last_name.label", 0, data.claimant_name?.last_name],
      [
        "name.claimant_has_alternate_names.label",
        0,
        asYesNo(data.LOCAL_claimant_has_alternate_names),
      ],
      ["name.first_name.label", 1, data.alternate_names?.[0]?.first_name],
      ["name.middle_name.label", 1, data.alternate_names?.[0]?.middle_name],
      ["name.last_name.label", 1, data.alternate_names?.[0]?.last_name],
      ["label.primary_address", 0, "Fortress, Of Solitude, Nowhere, AK 99999"],
      ["label.mailing_address", 0, "123 Fake St, Apt 3, Fakeville, NJ 12356"],
    ];
    expectedContents.forEach(([label, index, expected]) => {
      const field = within(personalSection)
        .getAllByText(label)
        ?.[index].closest("p");
      if (field === null) throw new Error("Field not found");
      const found = within(field).getByText(expected);
      expect(found).not.toBeNull();
    });
  });
});
