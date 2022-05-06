import states from "../../../fixtures/states.json";
import DropdownField from "../fields/DropdownField/DropdownField";
import { ComponentProps } from "react";

export type StateAbbrev = keyof typeof states;

type DropdownProps = ComponentProps<typeof DropdownField>;

type StatesDropdownProps = {
  stateSlice?: StateAbbrev[];
} & Omit<DropdownProps, "options">;

const allStates = Object.entries(states).map(([key, value]) => ({
  label: value,
  value: key,
}));

export const StatesDropdown = ({
  label,
  id,
  name,
  startEmpty,
  stateSlice,
}: StatesDropdownProps) => (
  <DropdownField
    label={label}
    id={id}
    name={name}
    startEmpty={startEmpty}
    options={
      stateSlice
        ? allStates.filter((opt) =>
            stateSlice.includes(opt.value as StateAbbrev)
          )
        : allStates
    }
  />
);
