import React from "react";

import HelpText from "./HelpText";
import { render } from "@testing-library/react";

describe("The Help Text component", () => {
  it("renders without crashing", () => {
    const { container } = render(<HelpText>Hello!</HelpText>);
    expect(container).toHaveTextContent("Hello!");
  });

  it("renders a markup", () => {
    const { container } = render(
      <HelpText>
        <div className="test-1-2-1-2" />
      </HelpText>
    );
    expect(container.firstChild?.firstChild).toHaveClass("test-1-2-1-2");
  });
});
