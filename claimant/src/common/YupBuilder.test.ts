import YupBuilder from "./YupBuilder";

describe("YupBuilder", () => {
  const self_employment: ClaimantInput["self_employment"] = {
    is_self_employed: "no",
    ownership_in_business: "no",
    is_corporate_officer: "no",
    related_to_owner: "no",
  };

  const selfEmploymentFields = { self_employment };

  describe("validates conditional schema", () => {
    const validationSchema = YupBuilder("claim-v1.0", ["self_employment"]);
    it("fails partial claims", () => {
      const partial = { self_employment: { ...self_employment } };
      delete partial.self_employment.is_self_employed;
      expect(() => validationSchema?.validateSync(partial)).toThrow();
    });
    it("passes incomplete but unrequired conditional fields", () => {
      const valid = validationSchema?.validateSync(selfEmploymentFields);
      expect(valid).toBeTruthy();
    });
    it("fails incomplete and required conditional fields", () => {
      const partial = {
        self_employment: {
          ...self_employment,
          ownership_in_business: "yes",
        },
      };
      expect(() => validationSchema?.validateSync(partial)).toThrow();
    });
    it("passes complete and required conditional fields", () => {
      const partial = {
        self_employment: {
          ...self_employment,
          ownership_in_business: "yes",
          name_of_business: "ACME Co",
        },
      };
      expect(validationSchema?.validateSync(partial)).toBeTruthy();
    });
    it("passes one required conditional field but fails the other", () => {
      const partial = {
        self_employment: {
          ...self_employment,
          ownership_in_business: "yes",
          name_of_business: "ACME Co",
          is_corporate_officer: "yes",
        },
      };
      expect(() => validationSchema?.validateSync(partial)).toThrow();
    });
    it("passes multiple required conditionals", () => {
      const partial = {
        self_employment: {
          ...self_employment,
          ownership_in_business: "yes",
          name_of_business: "ACME Co",
          is_corporate_officer: "yes",
          name_of_corporation: "MyCorp",
        },
      };
      expect(validationSchema?.validateSync(partial)).toBeTruthy();
    });
  });
});
