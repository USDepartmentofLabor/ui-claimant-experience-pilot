import { useEffect, ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import { RequestErrorBoundary } from "./RequestErrorBoundary";

describe("Error Boundary", () => {
  beforeEach(() => {
    jest.spyOn(console, "error");
    console.error.mockImplementation(jest.fn());
  });

  afterEach(() => {
    console.error.mockRestore();
  });

  const renderComponent = (children: ReactNode) => {
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
    expect(console.error).toHaveBeenCalled();
    expect(console.error.mock.calls[0][0]).toContain(
      "Error: Uncaught [Error: I am an error]"
    );
  });
  it("Does not render error message if no error", () => {
    renderComponent(<div>Vader, I am your child</div>);

    expect(screen.getByText("Vader, I am your child")).toBeVisible();
    expect(console.error.mock.calls.length).toBe(0);
  });
});
