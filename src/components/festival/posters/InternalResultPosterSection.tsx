"use client";

import { useEffect, useState } from "react";
import { ResultPosterActions } from "@/components/festival/posters/ResultPosterActions";
import {
  getResultPosterExportPayloadAction,
  type ResultPosterExportPayload,
} from "@/features/posters/actions/poster-export.actions";

export function InternalResultPosterSection({
  programmeId,
  festivalSlug,
  initialTemplateCode,
}: {
  programmeId: string;
  festivalSlug: string;
  initialTemplateCode?: string;
}) {
  const [payload, setPayload] = useState<ResultPosterExportPayload | null>(
    null,
  );

  useEffect(() => {
    let cancelled = false;
    void getResultPosterExportPayloadAction(programmeId, true).then((res) => {
      if (cancelled) return;
      if (res.success && res.data) setPayload(res.data);
      else setPayload(null);
    });
    return () => {
      cancelled = true;
    };
  }, [programmeId]);

  if (!payload) return null;

  return (
    <ResultPosterActions
      payload={payload}
      festivalSlug={festivalSlug}
      canSwap
      publicMode
      variant="inline"
      initialTemplateCode={
        initialTemplateCode ?? payload.assignedTemplateCode ?? undefined
      }
    />
  );
}
