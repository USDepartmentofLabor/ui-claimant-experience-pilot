import { UnionProfile } from "../../../components/form/UnionProfile/UnionProfile";
import { IPageDefinition } from "../../PageDefinitions";
import * as yup from "yup";
import { TFunction } from "react-i18next";

export const Union = () => {
  return <UnionProfile />;
};

const pageSchema = (t: TFunction<"claimForm">) =>
  yup.object().shape({
    union: yup.object().shape({
      is_union_member: yup
        .boolean()
        .required(t("union.is_union_member.required")),
      union_name: yup.string().when("is_union_member", {
        is: true,
        then: yup.string().max(32).required(t("union.union_name.required")),
      }),
      union_local_number: yup.string().when("is_union_member", {
        is: true,
        then: yup
          .string()
          .max(16)
          .required(t("union.union_local_number.required")),
      }),
      required_to_seek_work_through_hiring_hall: yup
        .boolean()
        .when("is_union_member", {
          is: true,
          then: yup
            .boolean()
            .required(
              "union.required_to_seek_work_through_hiring_hall.required"
            ),
        }),
    }),
  });

export const UnionPage: IPageDefinition = {
  path: "union",
  heading: "union",
  initialValues: {
    union: { is_union_member: undefined },
  },
  Component: Union,
  pageSchema,
};
