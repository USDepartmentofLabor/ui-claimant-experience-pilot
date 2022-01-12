import { UnionProfile } from "../../../components/form/UnionProfile/UnionProfile";
import { ClaimSchemaField } from "../../../common/YupBuilder";
import { IPageDefinition } from "../../PageDefinitions";

const schemaFields: ClaimSchemaField[] = ["union"];

export const Union = () => {
  return <UnionProfile />;
};

export const UnionPage: IPageDefinition = {
  path: "union",
  heading: "union",
  schemaFields: schemaFields,
  initialValues: {
    union: { is_union_member: undefined },
  },
  Component: Union,
};
