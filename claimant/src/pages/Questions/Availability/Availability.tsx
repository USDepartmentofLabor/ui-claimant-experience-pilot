import { YesNoQuestion } from "../../../components/form/YesNoQuestion/YesNoQuestion";
import TextAreaField from "../../../components/form/fields/TextAreaField/TextAreaField";
import { useFormikContext } from "formik";
import { IPageDefinition } from "../../PageDefinitions";
import { TFunction, useTranslation } from "react-i18next";
import * as yup from "yup";
import { useClearFields } from "../../../hooks/useClearFields";

export const Availability = () => {
  const { t } = useTranslation("claimForm", { keyPrefix: "availability" });
  const { values } = useFormikContext<ClaimantInput>();

  useClearFields(
    values.availability?.can_begin_work_immediately,
    "availability.cannot_begin_work_immediately_reason"
  );

  useClearFields(
    values.availability?.can_work_full_time,
    "availability.cannot_work_full_time_reason"
  );

  useClearFields(
    !values.availability?.is_prevented_from_accepting_full_time_work,
    "availability.is_prevented_from_accepting_full_time_work_reason"
  );

  return (
    <>
      <YesNoQuestion
        question={t("can_begin_work_immediately.label")}
        name="availability.can_begin_work_immediately"
      >
        {values.availability?.can_begin_work_immediately === false && (
          <TextAreaField
            name="availability.cannot_begin_work_immediately_reason"
            label={t("cannot_begin_work_immediately_reason.label")}
          />
        )}
      </YesNoQuestion>
      <YesNoQuestion
        question={t("can_work_full_time.label")}
        name="availability.can_work_full_time"
      >
        {values.availability?.can_work_full_time === false && (
          <TextAreaField
            name="availability.cannot_work_full_time_reason"
            label={t("cannot_work_full_time_reason.label")}
          />
        )}
      </YesNoQuestion>
      <YesNoQuestion
        question={t("is_prevented_from_accepting_full_time_work.label")}
        name="availability.is_prevented_from_accepting_full_time_work"
      >
        {values.availability?.is_prevented_from_accepting_full_time_work && (
          <TextAreaField
            name="availability.is_prevented_from_accepting_full_time_work_reason"
            label={t("is_prevented_from_accepting_full_time_work_reason.label")}
          />
        )}
      </YesNoQuestion>
    </>
  );
};

const pageSchema = (t: TFunction<"claimForm">) =>
  yup.object().shape({
    availability: yup.object().shape({
      can_begin_work_immediately: yup
        .boolean()
        .required(t("availability.can_begin_work_immediately.required")),
      cannot_begin_work_immediately_reason: yup
        .string()
        .when("can_begin_work_immediately", {
          is: false,
          then: yup
            .string()
            .required(
              t("availability.cannot_begin_work_immediately_reason.required")
            ),
        }),
      can_work_full_time: yup
        .boolean()
        .required(t("availability.can_work_full_time.required")),
      cannot_work_full_time_reason: yup.string().when("can_work_full_time", {
        is: false,
        then: yup
          .string()
          .required(t("availability.cannot_work_full_time_reason.required")),
      }),
      is_prevented_from_accepting_full_time_work: yup
        .boolean()
        .required(
          t("availability.is_prevented_from_accepting_full_time_work.required")
        ),
      is_prevented_from_accepting_full_time_work_reason: yup
        .string()
        .when("is_prevented_from_accepting_full_time_work", {
          is: true,
          then: yup
            .string()
            .required(
              t(
                "availability.is_prevented_from_accepting_full_time_work_reason.required"
              )
            ),
        }),
    }),
  });

export const AvailabilityPage: IPageDefinition = {
  path: "availability",
  heading: "availability",
  initialValues: {
    availability: {
      can_begin_work_immediately: undefined,
      can_work_full_time: undefined,
      is_prevented_from_accepting_full_time_work: undefined,
    },
  },
  Component: Availability,
  pageSchema,
};
