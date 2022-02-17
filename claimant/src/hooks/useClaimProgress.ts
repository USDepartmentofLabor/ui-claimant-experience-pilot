import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { pages } from "../pages/PageDefinitions";
import { Routes } from "../routes";

export const useClaimProgress = (claim: Partial<Claim> | undefined) => {
  const { t } = useTranslation("claimForm");
  const [continuePath, setContinuePath] = useState(Routes.CLAIM_FORM_HOME);

  useEffect(() => {
    if (!claim) return;

    let firstInvalidPage = "";

    for (const page of pages) {
      // Check segments before assuming it's one page
      if (page.segmentSchema && page.nextSegment) {
        let segment: string | false | undefined;
        while (segment !== false) {
          try {
            page.segmentSchema(t, segment).validateSync(claim);
            segment = page.nextSegment(segment);
          } catch (e) {
            firstInvalidPage = `${page.path}/${segment}/`;
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

    setContinuePath(Routes.CLAIM_FORM_HOME + firstInvalidPage);
  }, [claim]);

  return { continuePath };
};
