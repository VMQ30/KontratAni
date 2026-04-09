// MilestoneStepper.tsx (Buyer — contracts subfolder)

import { Card } from "@/components/ui/card";
import {
  Check,
  Sprout,
  Hourglass,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import {
  useAppStore,
  type MilestoneEvidence,
  type MilestoneVerificationStatus,
} from "@/store/useAppStore";

const stepLabels = [
  { key: "pending", label: "Pending" },
  { key: "seeds_planted", label: "Planted" },
  { key: "fertilized", label: "Fertilized" },
  { key: "growing", label: "Growing" },
  { key: "ready_for_harvest", label: "Ready for Harvest" },
  { key: "harvested", label: "Harvested" },
  { key: "delivered", label: "In Transit" },
];
function getEvidenceStatus(
  evidence: MilestoneEvidence[],
  key: string,
): MilestoneVerificationStatus | null {
  const entry = evidence.find((e) => e.cropStatus === key);
  return entry?.verificationStatus ?? null;
}

function verificationLabel(status: MilestoneVerificationStatus): string {
  switch (status) {
    case "pending_verification":
      return "Awaiting sign-off";
    case "disputed":
      return "Disputed";
    case "verified":
      return "Verified";
  }
}
const MilestoneStepper = () => {
  const { contracts, selectedContractId } = useAppStore();
  const contract = contracts.find((c) => c.id === selectedContractId);

  if (!contract) return null;
  const evidence = contract.milestoneEvidence ?? [];

  const steps = stepLabels.map((step, currentIndex) => {
    const statusIndex = stepLabels.findIndex(
      (s) => s.key === contract.cropStatus,
    );

    const evidenceStatus = getEvidenceStatus(evidence, step.key);

    const isInitialStep = currentIndex === 0;
    const hasMovedPastInitial = statusIndex > 0;

    const done =
      (isInitialStep && hasMovedPastInitial) ||
      (currentIndex < statusIndex && evidenceStatus === "verified");

    const active = currentIndex === statusIndex;
    const pending = evidenceStatus === "pending_verification";
    const disputed = evidenceStatus === "disputed";

    return {
      label: step.label,
      done,
      active,
      pending,
      disputed,
      evidenceStatus,
      detail:
        currentIndex === statusIndex && step.key === "seeds_planted"
          ? "100% Volume Planted"
          : undefined,
    };
  });

  function nodeStyle(s: (typeof steps)[0]): string {
    if (s.disputed) return "border-2 border-red-400 bg-red-50 text-red-600";
    if (s.pending)
      return "border-2 border-amber-400 bg-amber-50 text-amber-600";
    if (s.done) return "bg-primary text-primary-foreground";
    if (s.active) return "border-2 border-primary bg-primary/15 text-primary";
    return "border border-border bg-muted text-muted-foreground";
  }

  function NodeIcon({ s, i }: { s: (typeof steps)[0]; i: number }) {
    if (s.disputed) return <ShieldAlert className="h-4 w-4" />;
    if (s.pending) return <Hourglass className="h-4 w-4" />;
    if (s.done) return <Check className="h-4 w-4" />;
    if (s.active) return <Sprout className="h-4 w-4" />;
    return <>{i + 1}</>;
  }

  return (
    <Card className="border border-border bg-card p-6 shadow-none">
      <h2 className="mb-5 text-sm font-semibold uppercase tracking-wide text-body">
        Crop Journey
      </h2>

      {/* Desktop horizontal */}
      <div className="hidden items-start md:flex">
        {steps.map((s, i) => {
          const statusIndex = stepLabels.findIndex(
            (sl) => sl.key === contract.cropStatus,
          );
          const currentIndex = i; // 'i' is the index of the current step in the map

          const upcoming = !s.done && !s.active && !s.pending && !s.disputed;

          return (
            <div key={s.label} className="flex flex-1 flex-col items-center">
              <div className="flex w-full items-center">
                {/* LEFT CONNECTOR */}
                {i > 0 ? (
                  <div
                    className={`h-1 flex-1 rounded-full ${
                      currentIndex <= statusIndex
                        ? "bg-primary"
                        : "bg-progress-track"
                    }`}
                  />
                ) : (
                  <div className="h-1 flex-1" />
                )}

                {/* NODE (The Circle) */}
                <div
                  className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${nodeStyle(s)}`}
                >
                  <NodeIcon s={s} i={i} />
                </div>

                {/* RIGHT CONNECTOR */}
                {i < steps.length - 1 ? (
                  <div
                    className={`h-1 flex-1 rounded-full ${
                      currentIndex < statusIndex
                        ? "bg-primary"
                        : "bg-progress-track"
                    }`}
                  />
                ) : (
                  <div className="h-1 flex-1" />
                )}
              </div>

              {/* LABELS AND DETAILS */}
              <div className="mt-2 text-center">
                <span
                  className={`text-xs font-medium ${s.done || s.active ? "text-heading" : "text-muted-foreground"}`}
                >
                  {s.label}
                </span>
                {s.detail && (
                  <p className="text-xs text-primary">{s.detail}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {/* Mobile vertical */}
      <div className="flex flex-col gap-0 md:hidden">
        {steps.map((s, i) => (
          <div key={s.label} className="flex gap-3">
            <div className="flex flex-col items-center">
              {/* ── MODIFIED: uses nodeStyle / NodeIcon helpers ──────────────────
                  previous: hardcoded className switch + icon switch inline
              ── END ── */}
              <div
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${nodeStyle(s)}`}
              >
                <NodeIcon s={s} i={i} />
              </div>
              {i < steps.length - 1 && (
                <div
                  className={`w-0.5 flex-1 ${s.done ? "bg-primary" : "bg-progress-track"}`}
                  style={{ minHeight: 24 }}
                />
              )}
            </div>
            <div className="pb-5">
              <span
                className={`text-sm font-medium ${s.done || s.active ? "text-heading" : "text-muted-foreground"}`}
              >
                {s.label}
              </span>
              {/* ── NEW: verification sublabel on mobile ──────────────────────── */}
              {s.evidenceStatus && (
                <p
                  className={`text-xs ${
                    s.disputed
                      ? "text-red-500"
                      : s.pending
                        ? "text-amber-500"
                        : "text-emerald-600"
                  }`}
                >
                  {verificationLabel(s.evidenceStatus)}
                </p>
              )}
              {/* ── END ────────────────────────────────────────────────────────── */}
              {s.detail && <p className="text-xs text-primary">{s.detail}</p>}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default MilestoneStepper;
