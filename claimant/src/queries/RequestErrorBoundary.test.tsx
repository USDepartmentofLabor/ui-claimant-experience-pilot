import { useEffect, ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import { RequestErrorBoundary } from "./RequestErrorBoundary";

let consoleError: jest.Mock;

describe("Error Boundary", () => {
  beforeEach(() => {
    jest.spyOn(console, "error");
    consoleError = console.error as jest.Mock;
    consoleError.mockImplementation(jest.fn());
  });

  afterEach(() => {
    consoleError.mockRestore();
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
    expect(consoleError).toHaveBeenCalled();
    expect(consoleError.mock.calls[0][0]).toContain(
      "Error: Uncaught [Error: I am an error]"
    );
  });
  it("Does not render error message if no error", () => {
    renderComponent(<div>Vader, I am your child</div>);

    expect(screen.getByText("Vader, I am your child")).toBeVisible();
    expect(consoleError.mock.calls.length).toBe(0);
  });
});
