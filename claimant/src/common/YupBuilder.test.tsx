import { yupPhone, yupName, yupAddress, yupDate } from "./YupBuilder";
import { useTranslation } from "react-i18next";
import { ValidationError } from "yup";

jest.mock("react-i18next", () => ({
  useTranslation: () => {
    return {
      t: (str: string) => str,
    };
  },
}));

describe("YupBuilder", () => {
  const { t } = useTranslation("claimForm");

  describe("yupPhone", () => {
    it("validates", () => {
      const schema = yupPhone(t);
      const phone = { number: "555-555-1234", type: "", sms: false };
      expect(schema.validateSync(phone)).toEqual(phone);
    });
    describe("matches common patterns", () => {
      const schema = yupPhone(t);
      const patterns = [
        "+1 (555) 555-1234",
        "(555) 555-1234",
        "555 555-1234",
        "555 555.1234",
        "555 555 1234",
        "555.555.1234",
        "555-555-1234",
        "5555551234",
        "(555) 555.1234",
        "(555) 555 1234",
        "(555) 5551234",
        "(555) 5551234 123",
        "(555) 5551234x123",
        "(555) 555-1234 ext123",
      ];
      patterns.forEach((pattern) => {
        it(`matches ${pattern}`, () => {
          const phone = { number: pattern, type: "", sms: false };
          expect(schema.validateSync(phone)).toEqual(phone);
        });
      });
    });
    describe("requires something phone-number-like", () => {
      const schema = yupPhone(t);
      const patterns = [
        "my phone",
        "(555) 555-123",
        "555 555-123",
        "555 555.123",
        "555 555 123",
        "555.555.123",
        "555-555-123",
        "555555123",
        "(555) 555.123",
        "(555) 555 123",
        "(555) 555123",
        "(555) 555-123 ext123",
      ];
      patterns.forEach((pattern) => {
        it(`fails to match ${pattern}`, () => {
          const phone = { number: pattern, type: "", sms: false };
          expect(() => schema.validateSync(phone)).toThrow(ValidationError);
        });
      });
    });
  });

  describe("yupName", () => {
    it("validates", () => {
      const schema = yupName(t);
      const name = { first_name: "F", last_name: "L" };
      expect(schema.validateSync(name)).toEqual(name);
    });
  });

  describe("yupAddress", () => {
    it("validates", () => {
      const schema = yupAddress(t);
      const address = {
        address1: "123 Main",
        address2: "Suite 3",
        city: "Somewhere",
        state: "MN",
        zipcode: "00000",
      };
      expect(schema.validateSync(address)).toEqual(address);
    });
  });

  describe("yupDate", () => {
    it("validates", () => {
      const schema = yupDate(t);
      const date = "1999-02-02";
      expect(schema.validateSync(date)).toEqual(schema.cast(date));
    });
  });
});
