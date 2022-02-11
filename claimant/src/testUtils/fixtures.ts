import fs from "fs";
import path from "path";

const CLAIM_FORM_FIXTURES_PATH = "../fixtures/claim-form";

export const getValidClaimFormFixtures = (pageName: string) =>
  getClaimFormFixtures(pageName, "valid");

export const getInvalidClaimFormFixtures = (pageName: string) =>
  getClaimFormFixtures(pageName, "invalid");

const getClaimFormFixtures = (
  pageName: string,
  subDirectory: "valid" | "invalid"
) => {
  const pageFixturesPath = `${CLAIM_FORM_FIXTURES_PATH}/${pageName}/${subDirectory}`;

  return fs
    .readdirSync(path.resolve(__dirname, pageFixturesPath))
    .map((fileName) =>
      JSON.parse(
        fs.readFileSync(
          path.resolve(__dirname, `${pageFixturesPath}/${fileName}`),
          { encoding: "ascii" }
        ),
        (key, value) => {
          if (value === null) {
            return undefined;
          } else if (Array.isArray(value)) {
            return value.filter((arrayValue) => arrayValue !== null);
          }
          return value;
        }
      )
    );
};
