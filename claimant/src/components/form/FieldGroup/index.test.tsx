import React from "react";
import { shallow } from "enzyme";

import FieldGroup from "./index";

describe("The FieldGroup component", () => {
  it("renders without crashing", () => {
    shallow(<FieldGroup>Test</FieldGroup>);
  });

  it("renders children", () => {
    const component = shallow(
      <FieldGroup>
        <div id="test-component" />
      </FieldGroup>
    );

    expect(component.find("#test-component").exists()).toBe(true);
  });

  it("renders the correct classes", () => {
    const component = shallow(
      <FieldGroup error>
        <div id="test-component" />
      </FieldGroup>
    );

    expect(component.find(".usa-form-group--error").exists()).toBe(true);
  });
});
