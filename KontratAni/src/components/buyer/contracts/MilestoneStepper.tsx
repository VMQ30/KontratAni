// MilestoneStepper.tsx (Buyer — contracts subfolder)

import { Card } from "@/components/ui/card";
import { Check, Sprout,
  // ── NEW: icons for verification states ──────────────────────────────────────
  Hourglass, ShieldAlert, ShieldCheck,
  // ── END ──────────────────────────────────────────────────────────────────────
} from "lucide-react";
// ── MODIFIED: added MilestoneEvidence, MilestoneVerificationStatus to import ─
// previous: import { useAppStore } from "@/store/useAppStore";
import { useAppStore, type MilestoneEvidence, type MilestoneVerificationStatus } from "@/store/useAppStore";
// ── END ──────────────────────────────────────────────────────────────────────

const stepLabels = [
  { key: "pending", label: "Pending" },
  { key: "seeds_planted", label: "Planted" },
  { key: "fertilized", label: "Fertilized" },
  { key: "growing", label: "Growing" },
  { key: "ready_for_harvest", label: "Ready for Harvest" },
  { key: "harvested", label: "Harvested" },
  { key: "delivered", label: "In Transit" },
];

// ── NEW: helper — given milestoneEvidence array, find the verification status
// for a specific cropStatus key. Returns null if no evidence submitted yet.
function getEvidenceStatus(
  evidence: MilestoneEvidence[],
  key: string
): MilestoneVerificationStatus | null {
  const entry = evidence.find((e) => e.cropStatus === key);
  return entry?.verificationStatus ?? null;
}
// ── END ──────────────────────────────────────────────────────────────────────

// ── NEW: helper — map verification status to a label string ──────────────────
function verificationLabel(status: MilestoneVerificationStatus): string {
  switch (status) {
    case "pending_verification": return "Awaiting sign-off";
    case "disputed":             return "Disputed";
    case "verified":             return "Verified";
  }
}
// ── END ──────────────────────────────────────────────────────────────────────

const MilestoneStepper = () => {
  const { contracts, selectedContractId } = useAppStore();
  const contract = contracts.find((c) => c.id === selectedContractId);

  if (!contract) return null;

  // ── NEW: pull evidence array (safe default to empty) ─────────────────────
  const evidence = contract.milestoneEvidence ?? [];
  // ── END ────────────────────────────────────────────────────────────────────

  const steps = stepLabels.map((step) => {
    const statusIndex = stepLabels.findIndex((s) => s.key === contract.cropStatus);
    const currentIndex = stepLabels.findIndex((s) => s.key === step.key);

    // ── MODIFIED: step state now accounts for verification status ─────────────
    // previous logic only used done / active booleans based on cropStatus index.
    // New logic: a step is only truly "done" if its evidence is "verified".
    // If evidence exists but is pending_verification, show a pending state.
    // If disputed, show a disputed state regardless of position.

    const evidenceStatus = getEvidenceStatus(evidence, step.key);

    const done     = currentIndex < statusIndex && evidenceStatus === "verified";
    const active   = currentIndex === statusIndex;
    const pending  = evidenceStatus === "pending_verification";
    const disputed = evidenceStatus === "disputed";
    // ── END ────────────────────────────────────────────────────────────────────

    return {
      label: step.label,
      done,
      active,
      // ── NEW: expose pending / disputed / evidenceStatus on each step ─────────
      pending,
      disputed,
      evidenceStatus,
      // ── END ──────────────────────────────────────────────────────────────────
      detail: currentIndex === statusIndex && step.key === "seeds_planted"
        ? "100% Volume Planted"
        : undefined,
    };
  });

  // ── NEW: node style helper — maps step state to className ─────────────────
  function nodeStyle(s: typeof steps[0]): string {
    if (s.disputed)
      return "border-2 border-red-400 bg-red-50 text-red-600";
    if (s.pending)
      return "border-2 border-amber-400 bg-amber-50 text-amber-600";
    if (s.done)
      return "bg-primary text-primary-foreground";
    if (s.active)
      return "border-2 border-primary bg-primary/15 text-primary";
    return "border border-border bg-muted text-muted-foreground";
  }
  // ── END ────────────────────────────────────────────────────────────────────

  // ── NEW: node icon helper — returns the right icon per state ──────────────
  function NodeIcon({ s, i }: { s: typeof steps[0]; i: number }) {
    if (s.disputed)  return <ShieldAlert className="h-4 w-4" />;
    if (s.pending)   return <Hourglass className="h-4 w-4" />;
    if (s.done)      return <Check className="h-4 w-4" />;
    if (s.active)    return <Sprout className="h-4 w-4" />;
    return <>{i + 1}</>;
  }
  // ── END ────────────────────────────────────────────────────────────────────

  return (
    <Card className="border border-border bg-card p-6 shadow-none">
      <h2 className="mb-5 text-sm font-semibold uppercase tracking-wide text-body">
        Crop Journey
      </h2>

      {/* Desktop horizontal */}
      <div className="hidden items-start md:flex">
        {steps.map((s, i) => {
          const upcoming = !s.done && !s.active && !s.pending && !s.disputed;
          return (
            <div key={s.label} className="flex flex-1 flex-col items-center">
              <div className="flex w-full items-center">
                {i > 0 ? (
                  <div
                    className={`h-1 flex-1 rounded-full ${
                      // ── MODIFIED: connector colour accounts for disputed state ─
                      // previous: completed || active ? "bg-primary" : "bg-progress-track"
                      s.disputed
                        ? "bg-red-300"
                        : s.done || s.active
                        ? "bg-primary"
                        : "bg-progress-track"
                      // ── END ──────────────────────────────────────────────────
                    }`}
                  />
                ) : (
                  <div className="h-1 flex-1" />
                )}

                {/* ── MODIFIED: node uses nodeStyle / NodeIcon helpers ─────────
                    previous: hardcoded className switch + icon switch inline
                ── END ── */}
                <div className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${nodeStyle(s)}`}>
                  <NodeIcon s={s} i={i} />
                </div>

                {i < steps.length - 1 ? (
                  <div
                    className={`h-1 flex-1 rounded-full ${
                      s.done ? "bg-primary" : "bg-progress-track"
                    }`}
                  />
                ) : (
                  <div className="h-1 flex-1" />
                )}
              </div>

              <span className={`mt-2 text-center text-xs font-medium ${upcoming ? "text-muted-foreground" : "text-heading"}`}>
                {s.label}
              </span>

              {/* ── NEW: show verification sublabel under the step ───────────── */}
              {s.evidenceStatus && (
                <span className={`mt-0.5 text-center text-[10px] font-medium ${
                  s.disputed ? "text-red-500"
                  : s.pending ? "text-amber-500"
                  : "text-emerald-600"
                }`}>
                  {verificationLabel(s.evidenceStatus)}
                </span>
              )}
              {/* ── END ────────────────────────────────────────────────────── */}

              {s.detail && (
                <span className="mt-0.5 text-[10px] text-primary">{s.detail}</span>
              )}
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
              <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${nodeStyle(s)}`}>
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
              <span className={`text-sm font-medium ${s.done || s.active ? "text-heading" : "text-muted-foreground"}`}>
                {s.label}
              </span>
              {/* ── NEW: verification sublabel on mobile ──────────────────────── */}
              {s.evidenceStatus && (
                <p className={`text-xs ${
                  s.disputed ? "text-red-500"
                  : s.pending ? "text-amber-500"
                  : "text-emerald-600"
                }`}>
                  {verificationLabel(s.evidenceStatus)}
                </p>
              )}
              {/* ── END ────────────────────────────────────────────────────────── */}
              {s.detail && (
                <p className="text-xs text-primary">{s.detail}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default MilestoneStepper;