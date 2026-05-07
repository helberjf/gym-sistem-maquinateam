"use client";

import { useState } from "react";
import { LeadStatus } from "@prisma/client";
import { Button } from "@/components/ui/Button";
import { useApiMutation } from "@/components/dashboard/useApiMutation";
import { textareaClassName } from "@/components/dashboard/styles";

type LeadActionsProps = {
  leadId: string;
  status: LeadStatus;
};

type QualifyPayload = {
  action: "advance" | "lost" | "reopen";
  lostReason?: string;
};

export function LeadActions({ leadId, status }: LeadActionsProps) {
  const [showLostForm, setShowLostForm] = useState(false);
  const [lostReason, setLostReason] = useState("");

  const { submit: submitQualify, isPending } = useApiMutation<QualifyPayload>({
    endpoint: `/api/leads/${leadId}/qualify`,
    method: "POST",
  });

  const isClosed = status === LeadStatus.WON || status === LeadStatus.LOST;
  const canAdvance = !isClosed;

  function handleAdvance() {
    submitQualify({ action: "advance" });
  }

  function handleLostSubmit() {
    if (!lostReason.trim()) return;
    submitQualify({ action: "lost", lostReason: lostReason.trim() });
    setShowLostForm(false);
    setLostReason("");
  }

  function handleReopen() {
    submitQualify({ action: "reopen" });
  }

  return (
    <div className="flex flex-wrap gap-2">
      {canAdvance ? (
        <Button
          type="button"
          size="md"
          onClick={handleAdvance}
          loading={isPending}
        >
          Avancar pipeline
        </Button>
      ) : null}

      {!isClosed ? (
        <Button
          type="button"
          size="md"
          variant="outline-dark"
          onClick={() => setShowLostForm((value) => !value)}
        >
          Marcar como perdido
        </Button>
      ) : null}

      {status === LeadStatus.LOST ? (
        <Button
          type="button"
          size="md"
          variant="outline-dark"
          onClick={handleReopen}
          loading={isPending}
        >
          Reabrir lead
        </Button>
      ) : null}

      {showLostForm ? (
        <div className="mt-3 w-full space-y-2">
          <textarea
            value={lostReason}
            onChange={(event) => setLostReason(event.target.value)}
            maxLength={4000}
            placeholder="Motivo da perda (obrigatorio)"
            className={textareaClassName}
          />
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              onClick={handleLostSubmit}
              loading={isPending}
              disabled={!lostReason.trim()}
            >
              Confirmar perda
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline-dark"
              onClick={() => {
                setShowLostForm(false);
                setLostReason("");
              }}
            >
              Cancelar
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
