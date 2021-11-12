import { useEffect } from "react";
import { render, screen } from "@testing-library/react";
import { RequestErrorBoundary } from "./RequestErrorBoundary";

describe("Error Boundary", () => {
  const renderComponent = (children: any) => {
    render(<RequestErrorBoundary>{children}</RequestErrorBoundary>);
  };
  it("renders error boundary when there is an error", () => {
    const ComponentThatThrowsError = () => {
      useEffect(() => {
        throw new Error("I am an error");
      }, []);
      return <div>I am text</div>;
    };
    renderComponent(<ComponentThatThrowsError />);
    expect(screen.getByText("I am an error")).toBeVisible();
  });
  it("Does not render error message if no error", () => {
    renderComponent(<div>Vader, I am your child</div>);

    expect(screen.getByText("Vader, I am your child")).toBeVisible();
  });
});
