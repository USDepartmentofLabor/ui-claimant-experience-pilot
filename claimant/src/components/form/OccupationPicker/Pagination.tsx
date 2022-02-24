import {
  Button,
  IconNavigateBefore,
  IconNavigateNext,
} from "@trussworks/react-uswds";
import classnames from "classnames";
import { useTranslation } from "react-i18next";

interface IPaginationProps {
  currentIndex: number;
  setCurrentIndex: (page: number) => void;
  lastIndex: number;
  listName: string;
}

export const Pagination = ({
  currentIndex,
  lastIndex,
  setCurrentIndex,
  listName,
}: IPaginationProps) => {
  const { t } = useTranslation("common");

  const pages = pagination(currentIndex, lastIndex);

  return (
    <nav aria-label="Pagination" className="usa-pagination">
      <ul className="usa-pagination__list">
        {currentIndex !== 0 && (
          <li className="usa-pagination__item usa-pagination__arrow">
            <Button
              unstyled
              type="button"
              className="usa-pagination__link usa-pagination__previous-page"
              aria-label={t("pagination.previous_sr", { listName })}
              onClick={() => {
                setCurrentIndex(Math.max(0, currentIndex - 1));
              }}
            >
              <IconNavigateBefore aria-hidden="true" />
              <span className="usa-pagination__link-text">
                {t("pagination.previous")}
              </span>
            </Button>
          </li>
        )}
        {pages.map((page, i) =>
          typeof page === "number" ? (
            <li
              key={page}
              className="usa-pagination__item usa-pagination__page-no"
            >
              <Button
                unstyled
                type="button"
                onClick={() => {
                  setCurrentIndex(page - 1);
                }}
                className={classnames(
                  "usa-pagination__button",
                  page === currentIndex + 1 && "usa-current",
                  page !== currentIndex + 1 &&
                    "hover:text-no-underline hover:border-bottom"
                )}
                aria-label={t("pagination.page_sr", { listName, page })}
                aria-current={page === currentIndex + 1 ? "page" : undefined}
              >
                {page}
              </Button>
            </li>
          ) : (
            <li
              key={page + i}
              className="usa-pagination__item usa-pagination__overflow"
              role="presentation"
            >
              <span> … </span>
            </li>
          )
        )}
        {currentIndex !== lastIndex && (
          <li className="usa-pagination__item usa-pagination__arrow">
            <Button
              unstyled
              type="button"
              className="usa-pagination__link usa-pagination__next-page"
              aria-label={t("pagination.next_sr", { listName })}
              onClick={() => {
                setCurrentIndex(Math.min(lastIndex, currentIndex + 1));
              }}
            >
              <span className="usa-pagination__link-text">
                {t("pagination.next")}
              </span>
              <IconNavigateNext aria-hidden="true" />
            </Button>
          </li>
        )}
      </ul>
    </nav>
  );
};

function pagination(currentIndex: number, lastIndex: number) {
  const currentPage = currentIndex + 1;
  const lastPage = lastIndex + 1;

  const buttons = 3;
  let upperLimit = Math.min(currentPage, lastPage);
  let lowerLimit = upperLimit;

  for (let b = 1; b < buttons && b < lastPage; ) {
    if (lowerLimit > 1) {
      lowerLimit--;
      b++;
    }
    if (b < buttons && upperLimit < lastPage) {
      upperLimit++;
      b++;
    }
  }

  const pages: (number | "…")[] = [];

  for (let i = 1; i <= lastPage; i++) {
    if (i === 1 || i === lastPage || (i >= lowerLimit && i <= upperLimit)) {
      pages.push(i);
      continue;
    }
    if (pages[pages.length - 1] !== "…") {
      pages.push("…");
    }
  }

  return pages;
}
