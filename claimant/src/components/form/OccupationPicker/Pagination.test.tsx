import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Pagination } from "./Pagination";

const noop = jest.fn();

jest.mock("react-i18next", () => ({
  useTranslation: () => {
    return {
      t: (str: string) => str,
    };
  },
}));

describe("Pagination", () => {
  it("renders one page", () => {
    render(
      <Pagination
        currentIndex={0}
        lastIndex={0}
        setCurrentIndex={noop}
        listName="test list"
      />
    );

    expect(screen.queryByText("pagination.previous")).not.toBeInTheDocument();
    expect(screen.queryByText("pagination.next")).not.toBeInTheDocument();
    expect(screen.getAllByLabelText("pagination.page_sr")).toHaveLength(1);
    expect(screen.getByText("1")).toBeInTheDocument();
  });

  it("renders two pages and clicks them", () => {
    render(
      <Pagination
        currentIndex={0}
        lastIndex={1}
        setCurrentIndex={noop}
        listName="test list"
      />
    );

    expect(screen.queryByText("pagination.previous")).not.toBeInTheDocument();
    expect(screen.queryByText("pagination.next")).toBeInTheDocument();
    expect(screen.getAllByLabelText("pagination.page_sr")).toHaveLength(2);
    const first = screen.getByText("1");
    const second = screen.getByText("2");
    userEvent.click(second);
    expect(noop).toBeCalledWith(1);
    userEvent.click(first);
    expect(noop).toBeCalledWith(0);
  });

  it("renders ellipses for lots of pages", () => {
    render(
      <Pagination
        currentIndex={0}
        lastIndex={99}
        setCurrentIndex={noop}
        listName="test list"
      />
    );

    expect(screen.getAllByLabelText("pagination.page_sr")).toHaveLength(4);
    [1, 2, 3, "…", 100].forEach((num) => {
      expect(screen.getByText(num)).toBeInTheDocument();
    });
  });

  it("renders ellipses when you're in the middle somewhere", () => {
    // somewhere in the middle
    render(
      <Pagination
        currentIndex={49}
        lastIndex={99}
        setCurrentIndex={noop}
        listName="test list"
      />
    );
    expect(screen.getAllByLabelText("pagination.page_sr")).toHaveLength(5);
    // Two sets of elipses surrounding the current index
    expect(screen.getAllByText("…")).toHaveLength(2);
    [1, 49, 50, 51, 100].forEach((num) => {
      expect(screen.getByText(num)).toBeInTheDocument();
    });
  });
});
