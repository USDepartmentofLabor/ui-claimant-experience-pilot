import YupBuilder from "./YupBuilder";

describe("YupBuilder", () => {
  const self_employment: ClaimantInput["self_employment"] = {
    is_self_employed: false,
    ownership_in_business: "no",
    is_corporate_officer: "no",
    related_to_owner: "no",
  };

  const selfEmploymentFields = { self_employment };

  describe("validates self_employment conditional schema", () => {
    const validationSchema = YupBuilder("claim-v1.0", ["self_employment"]);
    it("fails partial claims", () => {
      const partial = { self_employment: { ...self_employment } };
      delete partial.self_employment.is_self_employed;
      expect(() => validationSchema?.validateSync(partial)).toThrow();
    });
    it("passes when all required sentinel fields are present with 'no'", () => {
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

  const union: ClaimantInput["union"] = {
    is_union_member: true,
    required_to_seek_work_through_hiring_hall: true,
    union_name: "United ACME",
    union_local_number: "12345",
  };

  const unionFields = { union };

  describe("validated union conditional schema", () => {
    const validationSchema = YupBuilder("claim-v1.0", ["union"]);
    it("fails partial claims", () => {
      const partial = { union: { ...union } };
      delete partial.union.is_union_member;
      expect(() => validationSchema?.validateSync(partial)).toThrow();
    });
    it("passes when all fields are present", () => {
      const valid = validationSchema?.validateSync(unionFields);
      expect(valid).toBeTruthy();
    });
    it("fails incomplete and required conditional fields", () => {
      const partial = {
        union: {
          ...union,
          required_to_seek_work_through_hiring_hall: undefined,
        },
      };
      expect(() => validationSchema?.validateSync(partial)).toThrow();
    });
  });
});
