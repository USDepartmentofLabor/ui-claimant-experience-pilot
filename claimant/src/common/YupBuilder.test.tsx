import { yupPhone, yupName, yupAddress, yupDate } from "./YupBuilder";
import { useTranslation } from "react-i18next";

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
      const schema = yupDate();
      const date = "1999-02-02";
      expect(schema.validateSync(date)).toEqual(schema.cast(date));
    });
  });
});
