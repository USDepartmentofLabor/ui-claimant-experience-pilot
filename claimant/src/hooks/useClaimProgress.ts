import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { pages } from "../pages/PageDefinitions";
import { Routes } from "../routes";

export const useClaimProgress = (
  partialClaimResponse: PartialClaimApiResponseType | undefined
) => {
  const { t } = useTranslation("claimForm");
  const [continuePath, setContinuePath] = useState(Routes.CLAIM_FORM_HOME);

  useEffect(() => {
    if (!partialClaimResponse) return;
    if (!partialClaimResponse.claim) return;

    const claim = partialClaimResponse.claim;

    let firstInvalidPage = "";

    for (const page of pages) {
      // Check segments before assuming it's one page
      if (page.segmentSchema && page.nextSegment) {
        let segment: string | false | undefined;
        while (segment !== false) {
          try {
            page.segmentSchema(t, segment).validateSync(claim);
            if (page.repeatable && page.repeatable(segment, claim)) {
              segment = page.nextSegment(segment);
            } else {
              segment = false;
            }
          } catch (e) {
            const segmentAsUrl = segment ? `${segment}/` : "";
            firstInvalidPage = `${page.path}/${segmentAsUrl}`;
            break;
          }
        }
      } else {
        // check page
        try {
          page.pageSchema(t).validateSync(claim);
        } catch (e) {
          firstInvalidPage = page.path;
        }
      }

      if (firstInvalidPage) break;
    }

    setContinuePath(
      Routes.CLAIM_FORM_HOME + (firstInvalidPage ? firstInvalidPage : "review")
    );
  }, [partialClaimResponse]);

  return { continuePath };
};
