import { render, screen, within } from "@testing-library/react";
import { Formik } from "formik";
import { MemoryRouter } from "react-router";
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
  email: "GeorgeWashington@whitehouse.gov", // populated from whoami but optional until then.
  phones: [
    { number: "1234567890", type: "mobile" },
    { number: "1234567", type: "home" },
  ],
  interpreter_required: true,
  preferred_language: "Klingon",
  LOCAL_more_phones: true,
  sex: "female",
  ethnicity: "hispanic",
  race: ["asian", "black"],

  disability: {
    has_collected_disability: true,
    disabled_immediately_before: false,
    type_of_disability: "workers_compensation",
    date_disability_began: "2020-03-01",
    recovery_date: "2022-01-01",
    contacted_last_employer_after_recovery: false,
  },
  ssn: "123-12-1234",
  birthdate: "2020-01-01",
  state_credential: {
    drivers_license_or_state_id_number: "12345",
    issuer: "WA",
  },
  work_authorization: {
    authorized_to_work: true,
    authorization_type: "permanent_resident",
    alien_registration_number: "12345",
  },
  availability: {
    can_begin_work_immediately: false,
    cannot_begin_work_immediately_reason:
      "I will be out of town for the next 2 weeks",
    can_work_full_time: false,
    cannot_work_full_time_reason: "I can only work 3 hours per day",
    is_prevented_from_accepting_full_time_work: true,
    is_prevented_from_accepting_full_time_work_reason:
      "I cannot change my schedule",
  },
  federal_income_tax_withheld: true,
  payment: {
    payment_method: "direct_deposit",
    account_type: "checking",
    routing_number: "123456",
    LOCAL_re_enter_routing_number: "123456",
    account_number: "12345678901234567890",
    LOCAL_re_enter_account_number: "12345678901234567890",
  },
  LOCAL_more_employers: [true, false],
  employers: [
    {
      name: "Recent employer 1",
      address: {
        address1: "123 Fake St",
        address2: "Apt 3",
        city: "Fakeville",
        state: "NJ",
        zipcode: "12356",
      },
      LOCAL_same_address: false,
      work_site_address: {
        address1: "Fortress",
        address2: "Of Solitude",
        city: "Nowhere",
        state: "AK",
        zipcode: "99999",
      },
      phones: [{ number: "1234567890" }, { number: "0987654321" }],
      LOCAL_same_phone: false,
      fein: "12345",
      separation_reason: "laid_off",
      separation_option: "lack_of_work",
      separation_comment: "I got laid off :(",
      first_work_date: "2020-01-01",
      last_work_date: "2020-12-31",
    },
    {
      name: "Recent employer 2",
      address: {
        address1: "123 Fake St",
        address2: "Apt 3",
        city: "Fakeville",
        state: "NJ",
        zipcode: "12356",
      },
      LOCAL_same_address: false,
      work_site_address: {
        address1: "Fortress",
        address2: "Of Solitude",
        city: "Nowhere",
        state: "AK",
        zipcode: "99999",
      },
      phones: [{ number: "1234567890" }, { number: "0987654321" }],
      LOCAL_same_phone: false,
      fein: "12345",
      separation_reason: "laid_off",
      separation_option: "lack_of_work",
      separation_comment: "I got laid off :(",
      first_work_date: "2020-01-01",
      last_work_date: "2020-12-31",
    },
  ],
  self_employment: {
    is_self_employed: true,
    ownership_in_business: true,
    name_of_business: "My business",
    is_corporate_officer: true,
    name_of_corporation: "My corporation",
    related_to_owner: true,
    corporation_or_partnership: true,
  },
  LOCAL_pay_types: ["severance"],
  other_pay: [
    {
      pay_type: "severance",
      note: "note",
      date_received: "2020-01-01",
      total: "$123.45",
    },
  ],
  occupation: {
    job_title: "Nurse",
    job_description: "I am a nurse",
    bls_description:
      'Assess patient health problems and needs, develop and implement nursing care plans, and maintain medical records. Administer nursing care to ill, injured, convalescent, or disabled patients. May advise patients on health maintenance and disease prevention or provide case management. Licensing or registration required. Includes Clinical Nurse Specialists. Excludes "Nurse Anesthetists" (29-1151), "Nurse Midwives" (29-1161), and "Nurse Practitioners" (29-1171).',
    bls_code: "29-1141.00",
    bls_title: "Registered Nurses",
  },
  attending_college_or_job_training: true,
  type_of_college_or_job_training: "part_time_student_during_working_hours",
  education_level: "bachelors",
  registered_with_vocational_rehab: true,
  union: {
    is_union_member: true,
    union_name: "ILWU",
    union_local_number: "10",
    required_to_seek_work_through_hiring_hall: false,
  },
};

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
    const expectedContents: [
      string,
      [string, number, string | undefined | null][]
    ][] = [
      [
        "page_headings.personal",
        [
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
          [
            "label.primary_address",
            0,
            "Fortress, Of Solitude, Nowhere, AK 99999",
          ],
          [
            "label.mailing_address",
            0,
            "123 Fake St, Apt 3, Fakeville, NJ 12356",
          ],
        ],
      ],
      [
        "page_headings.contact",
        [
          ["phone.number.label", 0, data?.phones?.[0].number],
          ["phone.type.label", 0, "phone.mobile"],
          ["more_phones", 0, asYesNo(data.LOCAL_more_phones)],
          ["phone.number.label", 1, data?.phones?.[1].number],
          ["phone.type.label", 1, "phone.home"],
          ["interpreter_required.label", 0, asYesNo(data.interpreter_required)],
          ["preferred_language.label", 0, data?.preferred_language],
        ],
      ],
      [
        "page_headings.identity",
        [
          ["ssn.label", 0, data.ssn],
          ["birthdate.label", 0, data.birthdate],
          [
            "state_credential.drivers_license_or_state_id_number.label",
            0,
            data.state_credential?.drivers_license_or_state_id_number,
          ],
          ["state_credential.issuer.label", 0, "Washington"],
          [
            "work_authorization.authorized_to_work.label",
            0,
            asYesNo(data.work_authorization?.authorized_to_work),
          ],
          [
            "work_authorization.authorization_type.label",
            0,
            "work_authorization.authorization_type.options.permanent_resident",
          ],
          [
            "work_authorization.alien_registration_number.label",
            0,
            data.work_authorization?.alien_registration_number,
          ],
        ],
      ],
      [
        "page_headings.demographic",
        [
          ["sex.label", 0, `sex.options.${data?.sex}`],
          ["ethnicity.label", 0, `ethnicity.options.${data?.ethnicity}`],
          [
            "race.label",
            0,
            data.race?.map((race) => `race.options.${race}`).join(", "),
          ],
        ],
      ],
      [
        "page_headings.disability",
        [
          [
            "has_collected_disability.label",
            0,
            asYesNo(data.disability?.has_collected_disability),
          ],
          [
            "disabled_immediately_before.label",
            0,
            asYesNo(data.disability?.disabled_immediately_before),
          ],
          [
            "type_of_disability.label",
            0,
            `type_of_disability.options.${data.disability?.type_of_disability}`,
          ],
          [
            "date_disability_began.label",
            0,
            data.disability?.date_disability_began,
          ],
          ["recovery_date.label", 0, data.disability?.recovery_date],
          [
            "contact_employer_after_recovering.label",
            0,
            asYesNo(data.disability?.contacted_last_employer_after_recovery),
          ],
        ],
      ],
      [
        "page_headings.availability",
        [
          [
            "can_begin_work_immediately.label",
            0,
            asYesNo(data.availability?.can_begin_work_immediately),
          ],
          [
            "provide_more_information",
            0,
            data.availability?.cannot_begin_work_immediately_reason,
          ],
          [
            "can_work_full_time.label",
            0,
            asYesNo(data.availability?.can_work_full_time),
          ],
          [
            "provide_more_information",
            1,
            data.availability?.cannot_work_full_time_reason,
          ],
          [
            "is_prevented_from_accepting_full_time_work.label",
            0,
            asYesNo(
              data.availability?.is_prevented_from_accepting_full_time_work
            ),
          ],
          [
            "provide_more_information",
            2,
            data.availability
              ?.is_prevented_from_accepting_full_time_work_reason,
          ],
        ],
      ],
      [
        "page_headings.payment",
        [
          [
            "federal_income_tax_withheld.label",
            0,
            asYesNo(data.federal_income_tax_withheld),
          ],
          [
            "payment_method.label",
            0,
            `payment_method.options.${data.payment?.payment_method}`,
          ],
          [
            "account_type.label",
            0,
            `account_type.options.${data.payment?.account_type}`,
          ],
          ["routing_number.label", 0, data.payment?.routing_number],
          ["account_number.label", 0, data.payment?.account_number],
        ],
      ],
      [
        "Recent employer 1",
        [
          ["name.label", 0, data.employers?.[0].name],
          [
            "work_site_address.heading",
            0,
            "Fortress, Of Solitude, Nowhere, AK 99999",
          ],
          [
            "same_address.label",
            0,
            asYesNo(data.employers?.[0].LOCAL_same_address),
          ],
          [
            "work_site_address.heading",
            0,
            "Fortress, Of Solitude, Nowhere, AK 99999",
          ],
          ["phones.number.label", 0, data.employers?.[0].phones[0].number],
          [
            "same_phone.label",
            0,
            asYesNo(data.employers?.[0].LOCAL_same_phone),
          ],
          ["alt_employer_phone", 0, data.employers?.[0].phones[1].number],
          ["fein.label", 0, data.employers?.[0].fein],
          [
            "separation.reason.label",
            0,
            `separation.reasons.${data.employers?.[0].separation_reason}.label`,
          ],
          [
            `separation.reasons.${data.employers?.[0].separation_reason}.option_heading`,
            0,
            `separation.reasons.${data.employers?.[0].separation_reason}.options.${data.employers?.[0].separation_option}`,
          ],
          [
            "separation.comment.optional_label",
            0,
            data.employers?.[0].separation_comment,
          ],
          ["first_work_date.label", 0, data.employers?.[0].first_work_date],
          ["last_work_date.label", 0, data.employers?.[0].last_work_date],
        ],
      ],
      [
        "Recent employer 2",
        [
          ["name.label", 0, data.employers?.[1].name],
          [
            "work_site_address.heading",
            0,
            "Fortress, Of Solitude, Nowhere, AK 99999",
          ],
          [
            "same_address.label",
            0,
            asYesNo(data.employers?.[1].LOCAL_same_address),
          ],
          [
            "work_site_address.heading",
            0,
            "Fortress, Of Solitude, Nowhere, AK 99999",
          ],
          ["phones.number.label", 0, data.employers?.[1].phones[0].number],
          [
            "same_phone.label",
            0,
            asYesNo(data.employers?.[1].LOCAL_same_phone),
          ],
          ["alt_employer_phone", 0, data.employers?.[1].phones[1].number],
          ["fein.label", 0, data.employers?.[1].fein],
          [
            "separation.reason.label",
            0,
            `separation.reasons.${data.employers?.[1].separation_reason}.label`,
          ],
          [
            `separation.reasons.${data.employers?.[1].separation_reason}.option_heading`,
            0,
            `separation.reasons.${data.employers?.[1].separation_reason}.options.${data.employers?.[1].separation_option}`,
          ],
          [
            "separation.comment.optional_label",
            0,
            data.employers?.[1].separation_comment,
          ],
          ["first_work_date.label", 0, data.employers?.[1].first_work_date],
          ["last_work_date.label", 0, data.employers?.[1].last_work_date],
        ],
      ],
      [
        "page_headings.self_employment",
        [
          [
            "self_employed.label",
            0,
            asYesNo(data.self_employment?.is_self_employed),
          ],
          [
            "business_ownership.label",
            0,
            asYesNo(data.self_employment?.ownership_in_business),
          ],
          ["business_name.label", 0, data.self_employment?.name_of_business],
          [
            "corporate_officer.label",
            0,
            asYesNo(data.self_employment?.is_corporate_officer),
          ],
          [
            "corporation_name.label",
            0,
            data.self_employment?.name_of_corporation,
          ],
          [
            "related_to_owner.label",
            0,
            asYesNo(data.self_employment?.related_to_owner),
          ],
          [
            "corporation_or_partnership.label",
            0,
            asYesNo(data.self_employment?.corporation_or_partnership),
          ],
        ],
      ],
      [
        "page_headings.other_pay",
        [
          [
            "pay_type.label",
            0,
            data.LOCAL_pay_types?.map(
              (local_pay_type) => `pay_type.options.${local_pay_type}.label`
            ).join(", "),
          ],
          ["total.label", 0, data.other_pay?.[0].total?.toString()],
          ["date_received.label", 0, data.other_pay?.[0].date_received],
          ["note.label", 0, data.other_pay?.[0].note],
        ],
      ],
      [
        "page_headings.occupation",
        [
          ["what_is_your_occupation.label", 0, data.occupation?.job_title],
          ["short_description.label", 0, data.occupation?.job_description],
        ],
      ],
      [
        "page_headings.education_vocational_rehab",
        [
          [
            "education_vocational_rehab.education.attending_training.label",
            0,
            asYesNo(data.attending_college_or_job_training),
          ],
          [
            "education_vocational_rehab.education.training_type.label",
            0,
            `education_vocational_rehab.education.training_type.options.${data.type_of_college_or_job_training}`,
          ],
          [
            "education_level.label",
            0,
            `education_level.options.${data.education_level}`,
          ],
          [
            "education_vocational_rehab.vocational_rehab.is_registered.label",
            0,
            asYesNo(data.registered_with_vocational_rehab),
          ],
        ],
      ],
      [
        "page_headings.union",
        [
          ["is_union_member.label", 0, asYesNo(data.union?.is_union_member)],
          ["union_name.label", 0, data.union?.union_name],
          ["union_local_number.label", 0, data.union?.union_local_number],
          [
            "required_to_seek_work_through_hiring_hall.label",
            0,
            asYesNo(data.union?.required_to_seek_work_through_hiring_hall),
          ],
        ],
      ],
    ];
    expectedContents.forEach(([pageHeading, fieldCheckList]) => {
      const section = screen.getAllByText(pageHeading)[0].closest("section");
      expect(section).not.toBeNull();
      if (section === null) throw new Error(`${pageHeading} section not found`);
      fieldCheckList.forEach(([label, index, expected]) => {
        const field = within(section).getAllByText(label)?.[index].closest("p");
        if (field === null) throw new Error("Field not found");
        expect(expected).not.toBeNull();
        const found = within(field).getByText(expected || "");
        expect(found).not.toBeNull();
      });
    });
  });
});
