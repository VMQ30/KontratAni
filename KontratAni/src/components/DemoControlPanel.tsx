// DemoControlPanel.tsx
//
// A self-contained floating panel for simulating the full verification lifecycle
// during demos. Zero changes required to any existing file — just add once to
// your root layout:
//
//   import { DemoControlPanel } from "@/components/DemoControlPanel";
//   // inside your root App / layout JSX, as the last child:
//   <DemoControlPanel />
//
// The panel is hidden behind a small corner button so it doesn't distract during
// a live demo, but is always reachable.

import { useState, useRef, useEffect, useCallback } from "react";
import {
  useAppStore,
  CropStatus,
  MilestoneEvidence,
  MilestoneVerificationStatus,
} from "@/store/useAppStore";
import {
  FlaskConical,
  X,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  Sprout,
  FastForward,
  CheckCircle2,
  AlertTriangle,
  Info,
  GripHorizontal,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

// Full ordered list of milestones — used for "fast-forward to stage" logic.
const MILESTONE_ORDER: CropStatus[] = [
  "seeds_planted",
  "fertilized",
  "growing",
  "ready_for_harvest",
  "harvested",
  "delivered",
];

// Progress value each verified milestone produces (mirrors VERIFIED_PROGRESS_MAP).
const PROGRESS_MAP: Record<CropStatus, number> = {
  pending: 0,
  seeds_planted: 25,
  fertilized: 40,
  growing: 60,
  ready_for_harvest: 80,
  harvested: 95,
  delivered: 100,
};

// Human-readable labels for the fast-forward selector.
const STAGE_LABELS: Record<CropStatus, string> = {
  pending: "Pending (reset)",
  seeds_planted: "Seeds Planted",
  fertilized: "Fertilized",
  growing: "Growing",
  ready_for_harvest: "Ready for Harvest",
  harvested: "Harvested",
  delivered: "Delivered (pending buyer confirm)",
};

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

// buildEvidence: creates a fully-verified evidence array covering all milestones
// from seeds_planted up to and including `targetStatus`.
// Used by the fast-forward action to populate milestoneEvidence correctly so
// ContractProgress, MilestoneStepper, and AuditLog all show a coherent history.
function buildEvidence(
  targetStatus: CropStatus,
  now: string,
): MilestoneEvidence[] {
  const targetIdx = MILESTONE_ORDER.indexOf(targetStatus);
  if (targetIdx < 0) return [];

  return MILESTONE_ORDER.slice(0, targetIdx + 1).map((cs, i) => ({
    cropStatus: cs,
    photoFileName: `demo_${cs}.jpg`,
    submittedAt: new Date(
      Date.now() - (targetIdx - i) * 3600_000 * 24,
    ).toISOString(),
    verificationStatus:
      cs === targetStatus && cs === "delivered"
        ? ("pending_verification" as MilestoneVerificationStatus)
        : ("verified" as MilestoneVerificationStatus),
    verifiedAt:
      cs === "delivered"
        ? undefined
        : new Date(Date.now() - (targetIdx - i) * 3600_000 * 12).toISOString(),
  }));
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: string }) {
  return (
    <p className="mb-2 text-[9px] font-bold uppercase tracking-widest text-forest/70">
      {children}
    </p>
  );
}

function ActionBtn({
  onClick,
  icon: Icon,
  label,
  sublabel,
  color = "gray",
  disabled = false,
}: {
  onClick: () => void;
  icon: React.ElementType;
  label: string;
  sublabel?: string;
  color?: "green" | "amber" | "red" | "violet" | "gray" | "blue";
  disabled?: boolean;
}) {
  const colorMap = {
    // Green -> Forest
    green: "border-forest/20 bg-forest/5 text-forest hover:bg-forest/10",
    // Amber -> Sand
    amber: "border-sand/40 bg-sand/10 text-terracotta hover:bg-sand/20",
    // Red -> Terracotta
    red: "border-terracotta/20 bg-terracotta/5 text-terracotta hover:bg-terracotta/10",
    // Violet -> Sage
    violet: "border-sage/40 bg-sage/10 text-forest hover:bg-sage/20",
    // Gray -> Muted
    gray: "border-border bg-muted/50 text-muted-foreground hover:bg-muted",
    // Blue -> Primary
    blue: "border-primary/20 bg-primary/5 text-primary hover:bg-primary/10",
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex w-full items-start gap-3 rounded-xl border px-3 py-2.5 text-left transition active:scale-[0.98] disabled:opacity-30 disabled:cursor-not-allowed",
        colorMap[color],
      )}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="min-w-0">
        <p className="text-xs font-semibold leading-tight">{label}</p>
        {sublabel && (
          <p className="mt-0.5 text-[10px] leading-relaxed opacity-70">
            {sublabel}
          </p>
        )}
      </div>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Contract status pill strip — live view of selected contract state
// ─────────────────────────────────────────────────────────────────────────────

function ContractStatusStrip({ contractId }: { contractId: string }) {
  const contract = useAppStore((s) =>
    s.contracts.find((c) => c.id === contractId),
  );
  if (!contract) return null;

  return (
    <div className="flex flex-wrap gap-1.5 rounded-lg bg-muted border border-border px-3 py-2">
      <span className="rounded-full bg-sage/20 px-2 py-0.5 text-[10px] font-mono text-forest">
        {contract.cropStatus.replace(/_/g, " ")}
      </span>
      <span className="rounded-full bg-sand/30 px-2 py-0.5 text-[10px] font-mono text-terracotta font-bold">
        {contract.progress}%
      </span>
      <span className="rounded-full bg-white/50 border border-border px-2 py-0.5 text-[10px] font-mono text-muted-foreground">
        {contract.status.replace(/_/g, " ")}
      </span>
      {contract.disputeFlag && (
        <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-semibold text-destructive">
          ⛔ frozen
        </span>
      )}
      {contract.pendingBuyerConfirmation && !contract.disputeFlag && (
        <span className="rounded-full bg-sand/30 px-2 py-0.5 text-[10px] font-semibold text-terracotta">
          ⏳ awaiting buyer
        </span>
      )}
      {contract.buyerConfirmedDelivery && (
        <span className="rounded-full bg-forest/10 px-2 py-0.5 text-[10px] font-semibold text-forest">
          ✓ buyer confirmed
        </span>
      )}
      <span className="rounded-full bg-sage/10 px-2 py-0.5 text-[10px] text-forest">
        {contract.milestoneEvidence.length} evidence
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main panel
// ─────────────────────────────────────────────────────────────────────────────

export function DemoControlPanel() {
  // ── Drag & resize state ─────────────────────────────────────────────────────
  // Position is stored as { x, y } from the top-left of the viewport.
  // Initialised to bottom-left to match the original fixed position.
  const [pos, setPos] = useState({ x: 20, y: window.innerHeight - 520 });
  const [size, setSize] = useState({ w: 360, h: 520 });

  // Refs hold the in-progress drag/resize origin so event handlers are stable.
  const dragOrigin = useRef<{
    mx: number;
    my: number;
    px: number;
    py: number;
  } | null>(null);
  const resizeOrigin = useRef<{
    mx: number;
    my: number;
    pw: number;
    ph: number;
  } | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // ── Drag: start on header mousedown ─────────────────────────────────────────
  const onDragStart = useCallback(
    (e: React.MouseEvent) => {
      // Don't hijack clicks on header buttons
      if ((e.target as HTMLElement).closest("button")) return;
      e.preventDefault();
      dragOrigin.current = {
        mx: e.clientX,
        my: e.clientY,
        px: pos.x,
        py: pos.y,
      };

      const onMove = (ev: MouseEvent) => {
        if (!dragOrigin.current) return;
        const dx = ev.clientX - dragOrigin.current.mx;
        const dy = ev.clientY - dragOrigin.current.my;
        setPos({
          x: Math.max(
            0,
            Math.min(window.innerWidth - size.w, dragOrigin.current.px + dx),
          ),
          y: Math.max(
            0,
            Math.min(window.innerHeight - size.h, dragOrigin.current.py + dy),
          ),
        });
      };

      const onUp = () => {
        dragOrigin.current = null;
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
      };

      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    },
    [pos, size.w],
  );

  // ── Resize: start on handle mousedown ───────────────────────────────────────
  const onResizeStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      resizeOrigin.current = {
        mx: e.clientX,
        my: e.clientY,
        pw: size.w,
        ph: size.h,
      };

      const onMove = (ev: MouseEvent) => {
        if (!resizeOrigin.current) return;
        const dx = ev.clientX - resizeOrigin.current.mx;
        const dy = ev.clientY - resizeOrigin.current.my;
        setSize({
          w: Math.max(280, Math.min(600, resizeOrigin.current.pw + dx)),
          h: Math.max(
            200,
            Math.min(window.innerHeight - 40, resizeOrigin.current.ph + dy),
          ),
        });
      };

      const onUp = () => {
        resizeOrigin.current = null;
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
      };

      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    },
    [size],
  );

  // ── Keep panel on-screen when window is resized ──────────────────────────────
  useEffect(() => {
    const onResize = () => {
      setPos((p) => ({
        x: Math.max(0, Math.min(window.innerWidth - size.w, p.x)),
        y: Math.max(0, Math.min(window.innerHeight - size.h, p.y)),
      }));
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [size.w, size.h]);

  // ── Store actions ───────────────────────────────────────────────────────────
  const contracts = useAppStore((s) => s.contracts);
  const submitMilestoneEvidence = useAppStore((s) => s.submitMilestoneEvidence);
  const verifyMilestone = useAppStore((s) => s.verifyMilestone);
  const disputeMilestone = useAppStore((s) => s.disputeMilestone);
  const resolveDispute = useAppStore((s) => s.resolveDispute);
  const resetContracts = useAppStore((s) => s.resetContracts);
  const updateContract = useAppStore((s) => s.updateContract);

  // ── Local UI state ──────────────────────────────────────────────────────────
  const [open, setOpen] = useState(false);
  const [minimised, setMinimised] = useState(false);
  const [selectedId, setSelectedId] = useState(contracts[0]?.id ?? "");
  const [fastTarget, setFastTarget] = useState<CropStatus>("growing");

  const contract = contracts.find((c) => c.id === selectedId) ?? null;

  // ─────────────────────────────────────────────────────────────────────────
  // Action handlers — each maps to one of the five simulation needs
  // ─────────────────────────────────────────────────────────────────────────

  // 1. Submit milestone evidence (skip photo upload)
  //    Calls submitMilestoneEvidence with a dummy filename.
  //    This moves the NEXT unlocked step to pending_verification.
  const handleSubmitNext = () => {
    if (!contract) return;

    // Determine which step comes next after the last verified one
    const lastVerifiedIdx = (() => {
      let idx = -1;
      contract.milestoneEvidence.forEach((e) => {
        if (e.verificationStatus === "verified") {
          idx = Math.max(idx, MILESTONE_ORDER.indexOf(e.cropStatus));
        }
      });
      return idx;
    })();

    const nextStep = MILESTONE_ORDER[lastVerifiedIdx + 1];
    if (!nextStep) {
      toast.info("All milestones already submitted.", { duration: 2500 });
      return;
    }

    submitMilestoneEvidence(
      selectedId,
      nextStep,
      `demo_${nextStep}_${Date.now()}.jpg`,
    );
    toast.success(`Evidence submitted: ${STAGE_LABELS[nextStep]}`, {
      description:
        "Awaiting buyer sign-off. Check ContractProgress to see the amber badge.",
      duration: 3500,
    });
  };

  // 2. Buyer co-confirm delivery
  //    Calls verifyMilestone("delivered") — the dual sign-off unlock.
  //    Requires that a "delivered" pending_verification evidence entry exists;
  //    if not, auto-creates one first so the confirm can fire cleanly.
  const handleBuyerConfirm = () => {
    if (!contract) return;

    const deliveredEvidence = contract.milestoneEvidence.find(
      (e) => e.cropStatus === "delivered",
    );

    if (!deliveredEvidence) {
      // Auto-submit delivery evidence first so verifyMilestone has something to verify
      submitMilestoneEvidence(
        selectedId,
        "delivered",
        `demo_delivered_${Date.now()}.jpg`,
      );
    }

    // Use a tiny timeout to let the submitMilestoneEvidence state update settle
    // before verifyMilestone reads the evidence array
    setTimeout(() => {
      verifyMilestone(selectedId, "delivered");
      toast.success("Buyer confirmed delivery!", {
        description:
          "buyerConfirmedDelivery = true. PayoutView and DirectPayoutView are now unlocked.",
        duration: 4000,
      });
    }, 80);
  };

  // 3. Raise a dispute
  //    Calls disputeMilestone on the most recent pending_verification entry.
  //    If none exists, auto-submits the next step first then disputes it.
  const handleRaiseDispute = () => {
    if (!contract) return;

    const pendingEntry = contract.milestoneEvidence.find(
      (e) => e.verificationStatus === "pending_verification",
    );

    if (pendingEntry) {
      disputeMilestone(
        selectedId,
        pendingEntry.cropStatus,
        "Demo dispute — simulated by judge.",
      );
      toast.error(
        `Dispute raised on: ${STAGE_LABELS[pendingEntry.cropStatus]}`,
        {
          description:
            "disputeFlag = true. Escrow is now frozen across all portals.",
          duration: 4000,
        },
      );
    } else {
      // Nothing pending — submit the next step then immediately dispute it
      const lastVerifiedIdx = (() => {
        let idx = -1;
        contract.milestoneEvidence.forEach((e) => {
          if (e.verificationStatus === "verified") {
            idx = Math.max(idx, MILESTONE_ORDER.indexOf(e.cropStatus));
          }
        });
        return idx;
      })();

      const nextStep = MILESTONE_ORDER[lastVerifiedIdx + 1] ?? "seeds_planted";
      submitMilestoneEvidence(
        selectedId,
        nextStep,
        `demo_${nextStep}_dispute.jpg`,
      );

      setTimeout(() => {
        disputeMilestone(
          selectedId,
          nextStep,
          "Demo dispute — simulated by judge.",
        );
        toast.error(`Dispute raised on: ${STAGE_LABELS[nextStep]}`, {
          description:
            "disputeFlag = true. Escrow is now frozen across all portals.",
          duration: 4000,
        });
      }, 80);
    }
  };

  // 4. Resolve a dispute
  //    Calls resolveDispute — resets disputeFlag and returns evidence to pending_verification.
  const handleResolveDispute = () => {
    if (!contract) return;
    if (!contract.disputeFlag) {
      toast.info("No active dispute on this contract.", { duration: 2000 });
      return;
    }
    resolveDispute(selectedId);
    toast.success("Dispute resolved.", {
      description:
        "disputeFlag = false. Evidence returned to pending_verification for re-review.",
      duration: 3500,
    });
  };

  // 5. Fast-forward to a specific crop stage
  //    Directly writes a fully-verified evidence array + correct progress + cropStatus
  //    via updateContract. This is the nuclear option — it bypasses the action chain
  //    entirely and sets the contract to a coherent target state in one step.
  //    All portals will immediately reflect the new state.
  const handleFastForward = () => {
    if (!contract) return;

    const now = new Date().toISOString();

    if (fastTarget === "pending") {
      // Reset just this contract back to its initial state
      updateContract(selectedId, {
        cropStatus: "pending",
        progress: 0,
        milestoneEvidence: [],
        pendingBuyerConfirmation: false,
        buyerConfirmedDelivery: false,
        disputeFlag: false,
        status: contract.escrowAmount > 0 ? "funded" : "accepted",
      });
      toast.success("Contract reset to pending.", {
        description: "All evidence cleared. Start fresh.",
        duration: 3000,
      });
      return;
    }

    const evidence = buildEvidence(fastTarget, now);
    const isDelivered = fastTarget === "delivered";

    updateContract(selectedId, {
      cropStatus: fastTarget,
      progress: PROGRESS_MAP[fastTarget],
      milestoneEvidence: evidence,
      // For "delivered", the last evidence entry stays pending_verification
      // so the buyer confirmation flow can be demonstrated naturally.
      pendingBuyerConfirmation: isDelivered,
      buyerConfirmedDelivery: false,
      disputeFlag: false,
      status: isDelivered
        ? "in_progress"
        : contract.escrowAmount > 0
          ? "in_progress"
          : "accepted",
    });

    toast.success(`Fast-forwarded to: ${STAGE_LABELS[fastTarget]}`, {
      description: isDelivered
        ? "Evidence submitted, awaiting buyer confirmation. Use 'Buyer Confirm Delivery' next."
        : "All milestones up to this stage are verified. ContractProgress and MilestoneStepper updated.",
      duration: 4000,
    });
  };

  // 6. Reset all contracts
  const handleReset = () => {
    resetContracts();
    setSelectedId(contracts[0]?.id ?? "");
    toast.success("All contracts reset to starting state.", {
      description: "Mock data restored. All portals updated.",
      duration: 3000,
    });
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Pill drag — shared logic used when the panel is collapsed.
  // Distinguishes a click (open panel) from a drag (move pill) by tracking
  // whether the pointer moved more than 4px before mouseup.
  // ─────────────────────────────────────────────────────────────────────────

  // Clamp pos so the expanded panel never spawns partially off-screen.
  const clampForPanel = useCallback(
    (p: { x: number; y: number }) => ({
      x: Math.max(0, Math.min(window.innerWidth - size.w, p.x)),
      y: Math.max(0, Math.min(window.innerHeight - size.h, p.y)),
    }),
    [size.w, size.h],
  );

  const onPillMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      const startX = e.clientX;
      const startY = e.clientY;
      const originPos = { ...pos };
      let didDrag = false;

      const onMove = (ev: MouseEvent) => {
        const dx = ev.clientX - startX;
        const dy = ev.clientY - startY;
        // Only start moving after 4px threshold — prevents accidental drift on click
        if (!didDrag && Math.hypot(dx, dy) < 4) return;
        didDrag = true;
        setPos({
          // Pill is 40px wide/tall — clamp so it stays fully on-screen
          x: Math.max(0, Math.min(window.innerWidth - 40, originPos.x + dx)),
          y: Math.max(0, Math.min(window.innerHeight - 40, originPos.y + dy)),
        });
      };

      const onUp = () => {
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
        // If the pointer barely moved, treat it as a click → open panel
        if (!didDrag) {
          setOpen(true);
          // Clamp pos so the panel doesn't spawn off-screen
          setPos((p) => clampForPanel(p));
        }
      };

      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    },
    [pos, clampForPanel],
  );

  // ─────────────────────────────────────────────────────────────────────────
  // Render: collapsed pill button (draggable)
  // ─────────────────────────────────────────────────────────────────────────

  if (!open) {
    return (
      <div
        onMouseDown={onPillMouseDown}
        title="Drag to move · Click to open"
        style={{ left: pos.x, top: pos.y }}
        className="fixed z-[9999] flex h-10 w-10 cursor-grab items-center justify-center rounded-full bg-accent text-primary shadow-lg transition-shadow hover:shadow-xl active:cursor-grabbing active:scale-95 select-none"
      >
        <FlaskConical className="h-5 w-5 pointer-events-none" />
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Render: expanded panel
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div
      ref={panelRef}
      style={{
        left: pos.x,
        top: pos.y,
        width: size.w,
        height: minimised ? "auto" : size.h,
      }}
      className="fixed z-[9999] flex flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-2xl"
    >
      {/* Header — drag handle */}
      <div
        onMouseDown={onDragStart}
        className="flex shrink-0 cursor-grab items-center justify-between bg-forest px-4 py-3 active:cursor-grabbing select-none"
      >
        <div className="flex items-center gap-2">
          <FlaskConical className="h-4 w-4 text-white" />
          <p className="text-sm font-bold text-white tracking-tight">
            Demo Control Panel
          </p>
          <span className="rounded-full bg-white/20 px-2 py-0.5 text-[9px] font-semibold text-white uppercase tracking-wider">
            simulation
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setMinimised(!minimised)}
            className="rounded p-1 text-white/70 hover:bg-white/10 transition"
            title={minimised ? "Expand" : "Minimise"}
          >
            {minimised ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
          <button
            onClick={() => setOpen(false)}
            className="rounded p-1 text-white/70 hover:bg-white/10 transition"
            title="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {!minimised && (
        <div className="flex-1 overflow-y-auto min-h-0 bg-background">
          {/* Contract selector */}
          <div className="border-b border-border px-4 py-3 space-y-2">
            <SectionLabel>Target Contract</SectionLabel>
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-forest/20 focus:outline-none"
            >
              {contracts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.id.slice(0, 8)} — {c.crop} ({c.status.replace(/_/g, " ")})
                </option>
              ))}
            </select>
            {selectedId && <ContractStatusStrip contractId={selectedId} />}
          </div>

          <div className="space-y-5 px-4 py-4">
            {/* ── Section 1: Milestone Evidence ── */}
            <div>
              <SectionLabel>Milestone Evidence</SectionLabel>
              <div className="space-y-2">
                <ActionBtn
                  icon={Sprout}
                  label="Submit Next Milestone (skip photo)"
                  sublabel="Submits the next unlocked milestone. Sets it to pending_verification."
                  color="blue"
                  onClick={handleSubmitNext}
                  disabled={!contract}
                />
              </div>
            </div>

            {/* ── Section 2: Buyer Sign-Off ── */}
            <div>
              <SectionLabel>Buyer Sign-Off</SectionLabel>
              <div className="space-y-2">
                <ActionBtn
                  icon={ShieldCheck}
                  label="Buyer Confirm Delivery"
                  sublabel="Calls verifyMilestone('delivered'). Unlocks payout portals."
                  color="green"
                  onClick={handleBuyerConfirm}
                  disabled={!contract}
                />
              </div>
            </div>

            {/* ── Section 3: Dispute Flow ── */}
            <div>
              <SectionLabel>Dispute Flow</SectionLabel>
              <div className="space-y-2">
                <ActionBtn
                  icon={ShieldAlert}
                  label="Raise Dispute"
                  sublabel="Freezes escrow. Targets the current pending entry."
                  color="red"
                  onClick={handleRaiseDispute}
                  disabled={!contract}
                />
                <ActionBtn
                  icon={ShieldX}
                  label="Resolve Dispute (Admin)"
                  sublabel="Unfreezes escrow. Returns evidence for re-review."
                  color="amber"
                  onClick={handleResolveDispute}
                  disabled={!contract || !contract.disputeFlag}
                />
              </div>
            </div>

            {/* ── Section 4: Fast-Forward ── */}
            <div>
              <SectionLabel>Fast-Forward to Stage</SectionLabel>
              <div className="space-y-2">
                <select
                  value={fastTarget}
                  onChange={(e) => setFastTarget(e.target.value as CropStatus)}
                  className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-forest/20 focus:outline-none"
                >
                  {(["pending", ...MILESTONE_ORDER] as CropStatus[]).map(
                    (s) => (
                      <option key={s} value={s}>
                        {STAGE_LABELS[s]}
                      </option>
                    ),
                  )}
                </select>
                <ActionBtn
                  icon={FastForward}
                  label={`Jump to: ${STAGE_LABELS[fastTarget]}`}
                  sublabel={
                    fastTarget === "pending"
                      ? "Clears all evidence and resets this contract only."
                      : "Writes a fully-verified history up to this stage."
                  }
                  color="violet"
                  onClick={handleFastForward}
                  disabled={!contract}
                />
              </div>

              {/* Tip box */}
              <div className="mt-2 flex items-start gap-2 rounded-lg border border-sage/20 bg-sage/5 px-3 py-2">
                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-forest" />
                <p className="text-[10px] leading-relaxed text-forest/80">
                  For a full demo: fast-forward to <strong>Growing</strong>,
                  then use <strong>Submit Next</strong> steps.
                </p>
              </div>
            </div>

            {/* ── Section 5: Reset ── */}
            <div className="border-t border-border pt-4">
              <SectionLabel>Global Reset</SectionLabel>
              <button
                onClick={handleReset}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-muted/50 py-3 text-sm font-semibold text-muted-foreground transition hover:bg-muted hover:text-foreground active:scale-[0.98]"
              >
                <RotateCcw className="h-4 w-4" />
                Reset All Contracts
              </button>
              <p className="mt-1.5 text-center text-[10px] text-muted-foreground">
                Restores mock data defaults.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Resize handle — bottom-right corner */}
      {!minimised && (
        <div
          onMouseDown={onResizeStart}
          title="Drag to resize"
          className="flex shrink-0 cursor-se-resize items-center justify-end border-t border-border bg-muted/30 px-2 py-1 select-none"
        >
          <GripHorizontal className="h-3.5 w-3.5 rotate-45 text-muted-foreground/30" />
        </div>
      )}
    </div>
  );
}
