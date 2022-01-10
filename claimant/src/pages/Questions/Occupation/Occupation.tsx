import { OccupationPicker } from "../../../components/form/OccupationPicker/OccupationPicker";
import { ClaimSchemaField } from "../../../common/YupBuilder";
import { IPageDefinition } from "../../PageDefinitions";

const schemaFields: ClaimSchemaField[] = ["occupation"];

export const Occupation = () => {
  return <OccupationPicker />;
};

export const OccupationPage: IPageDefinition = {
  path: "occupation",
  schemaFields: schemaFields,
  initialValues: {
    occupation: {},
  },
  Component: Occupation,
};
