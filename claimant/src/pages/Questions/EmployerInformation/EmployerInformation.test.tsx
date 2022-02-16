import { render, within, waitFor, screen } from "@testing-library/react";
import { Formik } from "formik";
import {
  EmployerInformation,
  EmployerInformationPage,
} from "./EmployerInformation";
import { noop } from "../../../testUtils/noop";
import { ComponentProps } from "react";
import { Trans, useTranslation } from "react-i18next";
import { EMPLOYER_SKELETON } from "../../../utils/claim_form";
import { ValidationError } from "yup";

jest.mock("react-i18next", () => ({
  useTranslation: () => {
    return {
      t: (str: string) => str,
    };
  },
  Trans: ({ children }: ComponentProps<typeof Trans>) => <>{children}</>,
}));

describe("EmployerInformation Page", () => {
  it("renders properly", () => {
    const { getByRole } = render(
      <Formik
        initialValues={{ employers: [{ ...EMPLOYER_SKELETON }] }}
        onSubmit={noop}
      >
        <EmployerInformation segment={undefined} />
      </Formik>
    );

    const moreEmployersFieldSet = getByRole("group", {
      name: "employers.more_employers.label",
    });

    const yesMoreEmployers = within(moreEmployersFieldSet).getByRole("radio", {
      name: "yes",
    });
    const noMoreEmployers = within(moreEmployersFieldSet).getByRole("radio", {
      name: "no",
    });

    expect(moreEmployersFieldSet).toBeInTheDocument();
    expect(yesMoreEmployers).toBeInTheDocument();
    expect(noMoreEmployers).toBeInTheDocument();
  });

  it("segments correctly, one employer per page", async () => {
    render(
      <Formik
        initialValues={{ employers: [{ ...EMPLOYER_SKELETON }] }}
        onSubmit={noop}
      >
        <EmployerInformation segment={"2"} />
      </Formik>
    );

    await waitFor(() => {
      const address1 = screen.getByTestId("employers[2].address.address1");
      expect(address1).toBeInTheDocument();
    });
  });

  it("paginates based on segment", () => {
    if (EmployerInformationPage.repeatable) {
      expect(EmployerInformationPage.repeatable("1", {})).toEqual(false);
      expect(
        EmployerInformationPage.repeatable("1", {
          LOCAL_more_employers: [true, false],
        })
      ).toEqual(false);
      expect(
        EmployerInformationPage.repeatable("1", {
          LOCAL_more_employers: [true, true],
        })
      ).toEqual(true);
    } else {
      throw new Error("Employer repeatable is not defined");
    }

    if (EmployerInformationPage.nextSegment) {
      expect(EmployerInformationPage.nextSegment(undefined)).toEqual("1");
      expect(EmployerInformationPage.nextSegment("1")).toEqual("2");
      expect(EmployerInformationPage.nextSegment("1")).toEqual("2");
      expect(EmployerInformationPage.nextSegment("10")).toEqual("11");
    } else {
      throw new Error("Employer nextSegment is not defined");
    }

    if (EmployerInformationPage.previousSegment) {
      expect(EmployerInformationPage.previousSegment({})).toEqual(false);
      expect(EmployerInformationPage.previousSegment({ segment: "0" })).toEqual(
        false
      );
      expect(EmployerInformationPage.previousSegment({ segment: "1" })).toEqual(
        "0"
      );
      expect(
        EmployerInformationPage.previousSegment({ segment: "10" })
      ).toEqual("9");
    } else {
      throw new Error("Employer previousSegment is not defined");
    }
  });

  it("validates Employer", () => {
    const { t } = useTranslation("claimForm");
    const schema = EmployerInformationPage.pageSchema(t);
    expect(schema.validateSync(undefined)).toEqual({
      LOCAL_more_employers: undefined,
      employers: undefined,
    });

    const emptyPage = {
      LOCAL_more_employers: [false],
      employers: [],
    };
    expect(schema.validateSync(emptyPage)).toEqual(emptyPage);

    const validPage = schema.cast({
      LOCAL_more_employers: [false],
      employers: [
        {
          name: "ACME",
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
        },
      ],
    });
    expect(schema.validateSync(validPage)).toEqual(validPage);

    expect(() => schema.validateSync({ employers: [{}] })).toThrow(
      ValidationError
    );
  });
});
