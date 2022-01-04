import { formatUserInputDate } from "./format";

describe("formatUserInputDate", () => {
  it("returns the expected date", () => {
    const inputDateString1 = "10/18/2020";
    const inputDateString2 = "January 11, 2014";
    const result1 = formatUserInputDate(inputDateString1);
    expect(result1).toEqual("2020-10-18");
    const result2 = formatUserInputDate(inputDateString2);
    expect(result2).toEqual("2014-01-11");
  });
  it("returns the input string if it is an invalid date", () => {
    const invalidDateString = "21-21-19";
    const result = formatUserInputDate(invalidDateString);
    expect(result).toEqual(invalidDateString);
  });
});
