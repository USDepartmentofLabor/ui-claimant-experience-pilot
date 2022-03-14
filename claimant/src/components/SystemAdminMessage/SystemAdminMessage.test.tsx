import { SystemAdminMessage } from "./SystemAdminMessage";
import { render, screen } from "@testing-library/react";

describe("SystemAdminMessage component", () => {
  it("renders properly", () => {
    render(
      <SystemAdminMessage variant={"emergency"}>
        Test message
      </SystemAdminMessage>
    );

    const siteAlert = screen.getByTestId("site-alert");

    expect(siteAlert).toHaveClass("usa-site-alert usa-site-alert--emergency");
  });

  it("has a default variant", () => {
    render(<SystemAdminMessage>Test message</SystemAdminMessage>);

    const siteAlert = screen.getByTestId("site-alert");

    expect(siteAlert).toHaveClass("usa-site-alert usa-site-alert--info");
  });
});
