// ContractProgress.tsx
// Renamed from MilestoneUpdaterView.tsx — see rename rationale at bottom.
 
// ── modified code starts here ─────────────────────────────────────────────────
// previous imports (MilestoneUpdaterView):
//   import { useState } from "react";
//   import { useAppStore, CropStatus, Contract } from "@/store/useAppStore";
//   import { Sprout, Droplets, Sun, Scissors, Truck, CheckCircle2,
//            Circle, ChevronRight, Clock, AlertCircle } from "lucide-react";
//
// Changes:
//   - Added useRef (needed for the photo file input ref)
//   - Added MilestoneEvidence, MilestoneVerificationStatus from store
//   - Replaced Circle with Upload, ImagePlus, ShieldAlert, ShieldCheck, Hourglass, X
//     for the new evidence submission UI and verification badges
import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  useAppStore,
  CropStatus,
  Contract,
  MilestoneEvidence,
  MilestoneVerificationStatus,
} from "@/store/useAppStore";
import {
  Sprout, Droplets, Sun, Scissors, Truck, CheckCircle2,
  ChevronRight, Clock, AlertCircle,
  Upload, ImagePlus, ShieldAlert, ShieldCheck, Hourglass, X,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
// ── end ───────────────────────────────────────────────────────────────────────
 
// ── MilestoneStep type — unchanged ────────────────────────────────────────────
interface MilestoneStep {
  status: CropStatus;
  label: string;
  sublabel: string;
  icon: React.ElementType;
  buttonLabel: string;
  color: string;
  bgColor: string;
  borderColor: string;
}
 
// ── MILESTONES constant — modified ────────────────────────────────────────────
// previous buttonLabel values: "Mark: Seeds Planted", "Mark: Fertilized" etc.
// modified code starts here ───────────────────────────────────────────────────
// Renamed to "Submit: …" to reflect that clicking no longer marks complete —
// it submits evidence for buyer co-confirmation instead.
const MILESTONES: MilestoneStep[] = [
  { status: "seeds_planted",     label: "Seeds Planted",     sublabel: "Binhi naitanim na",       icon: Sprout,       buttonLabel: "Submit: Seeds Planted",     color: "text-emerald-700", bgColor: "bg-emerald-50", borderColor: "border-emerald-200" },
  { status: "fertilized",        label: "Fertilized",        sublabel: "Pataba nailagay na",       icon: Droplets,     buttonLabel: "Submit: Fertilized",        color: "text-blue-700",    bgColor: "bg-blue-50",    borderColor: "border-blue-200"    },
  { status: "growing",           label: "Growing",           sublabel: "Lumalaki na ang tanim",    icon: Sun,          buttonLabel: "Submit: Growing",           color: "text-amber-700",   bgColor: "bg-amber-50",   borderColor: "border-amber-200"   },
  { status: "ready_for_harvest", label: "Ready for Harvest", sublabel: "Handa na sa ani",          icon: Scissors,     buttonLabel: "Submit: Ready for Harvest", color: "text-orange-700",  bgColor: "bg-orange-50",  borderColor: "border-orange-200"  },
  { status: "harvested",         label: "Harvested",         sublabel: "Na-ani na",                icon: CheckCircle2, buttonLabel: "Submit: Harvested",         color: "text-purple-700",  bgColor: "bg-purple-50",  borderColor: "border-purple-200"  },
  { status: "delivered",         label: "Delivered",         sublabel: "Naihatid na sa buyer",     icon: Truck,        buttonLabel: "Submit: Delivered",         color: "text-green-700",   bgColor: "bg-green-50",   borderColor: "border-green-200"   },
];
// ── end ───────────────────────────────────────────────────────────────────────
 
// ── STATUS_ORDER and getStepIndex — unchanged ─────────────────────────────────
const STATUS_ORDER: CropStatus[] = [
  "pending", "seeds_planted", "fertilized", "growing",
  "ready_for_harvest", "harvested", "delivered",
];
 
function getStepIndex(status: CropStatus): number {
  return STATUS_ORDER.indexOf(status);
}
 
// ── new code starts here ──────────────────────────────────────────────────────
// VerificationBadge: new sub-component.
// Renders a coloured pill for each evidence verification state so both the
// farmer and any reviewer can see at a glance where a milestone stands.
// Used inside TimelineStep next to each submitted milestone.
function VerificationBadge({ status }: { status: MilestoneVerificationStatus }) {
  if (status === "verified") {
    return (
      <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 border border-emerald-200">
        <ShieldCheck className="h-3 w-3" /> Co-confirmed
      </span>
    );
  }
  if (status === "pending_verification") {
    return (
      <span className="flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 border border-amber-200">
        <Hourglass className="h-3 w-3" /> Awaiting buyer sign-off
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700 border border-red-200">
      <ShieldAlert className="h-3 w-3" /> Disputed
    </span>
  );
}
// ── end ───────────────────────────────────────────────────────────────────────
 
// ── new code starts here ──────────────────────────────────────────────────────
// PhotoUpload: new sub-component.
// Simulates a file picker for photo evidence. In production this would POST
// to cloud storage; here it just captures the filename string to store in
// MilestoneEvidence.photoFileName. The submit button stays disabled until
// a file is selected, preventing evidence-free submissions.
function PhotoUpload({
  onFileSelected,
  fileName,
  onClear,
}: {
  onFileSelected: (name: string) => void;
  fileName: string | null;
  onClear: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
 
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onFileSelected(file.name);
  };
 
  if (fileName) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
        <ImagePlus className="h-4 w-4 shrink-0" />
        <span className="flex-1 truncate font-medium">{fileName}</span>
        <button onClick={onClear} className="ml-1 shrink-0 rounded p-0.5 hover:bg-emerald-100">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }
 
  return (
    <button
      type="button"
      onClick={() => inputRef.current?.click()}
      className="flex w-full items-center gap-2 rounded-lg border border-dashed border-border bg-muted/40 px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:border-[#2D6A4F]/50 hover:bg-[#2D6A4F]/5 hover:text-[#2D6A4F]"
    >
      <Upload className="h-4 w-4 shrink-0" />
      <span>Attach photo evidence <span className="text-red-500">*</span></span>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleChange} />
    </button>
  );
}
// ── end ───────────────────────────────────────────────────────────────────────
 
// ── new code starts here ──────────────────────────────────────────────────────
// DisputeModal: new sub-component.
// Opens when the farmer clicks "Dispute" on a pending milestone.
// Requires a typed reason before enabling the confirm button, preventing
// accidental disputes. On confirm it calls disputeMilestone() in the store,
// which sets disputeFlag = true and freezes escrow across all portals.
function DisputeModal({
  cropStatus,
  onConfirm,
  onCancel,
}: {
  cropStatus: CropStatus;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
}) {
  const [reason, setReason] = useState("");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-background p-6 shadow-xl">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-50">
            <ShieldAlert className="h-5 w-5 text-red-600" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Raise a Dispute</h3>
            <p className="text-xs text-muted-foreground">This will freeze escrow and flag for admin review.</p>
          </div>
        </div>
        <textarea
          className="w-full rounded-lg border border-border bg-muted/40 p-3 text-sm placeholder:text-muted-foreground focus:border-red-300 focus:outline-none"
          rows={3}
          placeholder="Describe the issue (e.g. photo does not match actual field condition)…"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        <div className="mt-4 flex gap-2">
          <button
            onClick={() => reason.trim() && onConfirm(reason.trim())}
            disabled={!reason.trim()}
            className="flex-1 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-40"
          >
            Freeze Escrow & Submit Dispute
          </button>
          <button
            onClick={onCancel}
            className="rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
// ── end ───────────────────────────────────────────────────────────────────────
 
// ── modified code starts here ─────────────────────────────────────────────────
// previous TimelineStep props:
//   { step, state: "done"|"next"|"locked", isNext, onUpdate, isLast }
//
// Changes:
//   - state extended to: "verified"|"pending"|"disputed"|"next"|"locked"
//     "done" is renamed "verified" to be explicit about sign-off status
//   - Added evidence prop (the MilestoneEvidence record for this step, if any)
//   - Added onDispute prop (called when farmer raises a dispute on a pending step)
//   - Removed isNext prop (redundant — derived from state === "next")
//   - onUpdate renamed onSubmit and now requires a photoFileName argument
//   - The button now expands an evidence panel instead of directly calling onUpdate
//   - A 600ms spinner on submit is replaced with a proper async loading state
function TimelineStep({
  step,
  state,
  evidence,
  onSubmit,
  onDispute,
  isLast,
}: {
  step: MilestoneStep;
  state: "verified" | "pending" | "disputed" | "next" | "locked";
  evidence: MilestoneEvidence | undefined;
  onSubmit: (photoFileName: string) => void;
  onDispute: () => void;
  isLast: boolean;
}) {
// ── end ───────────────────────────────────────────────────────────────────────
 
  const Icon = step.icon;
  const [expanded, setExpanded] = useState(false);
  const [photoFile, setPhotoFile] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
 
  // ── modified code starts here ───────────────────────────────────────────────
  // previous handleClick:
  //   if (state !== "next") return;
  //   setLoading(true);
  //   await new Promise((r) => setTimeout(r, 600));
  //   onUpdate();       ← called immediately, no photo required
  //   setLoading(false);
  //
  // New handleSubmit:
  //   - Requires photoFile to be set before submitting (enforced by disabled attr)
  //   - Calls onSubmit(photoFile) which routes to submitMilestoneEvidence in store
  //   - Collapses the panel and resets photo state after submission
  const handleSubmit = async () => {
    if (!photoFile) {
      toast.error("Please attach a photo before submitting.");
      return;
    }
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 700));
    onSubmit(photoFile);
    setPhotoFile(null);
    setExpanded(false);
    setSubmitting(false);
  };
  // ── end ─────────────────────────────────────────────────────────────────────
 
  // ── modified code starts here ───────────────────────────────────────────────
  // previous node style: two states — done (green filled) and next (outlined) and locked (muted)
  // New node style: four states — verified (green), pending (amber), disputed (red), next (outlined), locked (muted)
  const spineColor =
    state === "verified" ? "bg-[#2D6A4F]/40"
    : state === "disputed" ? "bg-red-200"
    : "bg-border";
 
  const nodeStyle =
    state === "verified" ? "border-[#2D6A4F] bg-[#2D6A4F] text-white"
    : state === "pending"  ? "border-amber-400 bg-amber-50 text-amber-600"
    : state === "disputed" ? "border-red-400 bg-red-50 text-red-600"
    : state === "next"     ? cn(step.bgColor, step.borderColor, step.color)
    : "border-border bg-muted text-muted-foreground/40";
  // ── end ─────────────────────────────────────────────────────────────────────
 
  return (
    <div className="flex gap-4">
      {/* Spine */}
      <div className="flex flex-col items-center">
        <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-300", nodeStyle)}>
          {/* modified code starts here ────────────────────────────────────────
              previous: done → CheckCircle2, active → step.icon, else step.icon
              New: verified → CheckCircle2, pending → Hourglass, disputed → ShieldAlert, else step.icon
          ── end ── */}
          {state === "verified" ? <CheckCircle2 className="h-5 w-5" />
          : state === "pending"  ? <Hourglass className="h-5 w-5" />
          : state === "disputed" ? <ShieldAlert className="h-5 w-5" />
          : <Icon className="h-5 w-5" />}
        </div>
        {!isLast && (
          <div className={cn("mt-1 w-0.5 flex-1 transition-colors duration-300", spineColor)} style={{ minHeight: 32 }} />
        )}
      </div>
 
      {/* Content */}
      <div className="flex-1 pb-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className={cn("font-semibold", state === "locked" ? "text-muted-foreground/50" : "text-foreground")}>
              {step.label}
            </p>
            <p className="text-sm text-muted-foreground">{step.sublabel}</p>
          </div>
 
          <div className="flex items-center gap-2">
            {/* modified code starts here ──────────────────────────────────────
                previous: done → Badge "✓ Done"   (only one badge, no dispute option)
                New: verification state → VerificationBadge component
                     pending steps additionally show a "Dispute" button
            ── end ── */}
            {(state === "verified" || state === "pending" || state === "disputed") && (
              <VerificationBadge status={
                state === "verified" ? "verified"
                : state === "disputed" ? "disputed"
                : "pending_verification"
              } />
            )}
 
            {/* new code starts here ─────────────────────────────────────────
                Dispute button — only visible on "pending" steps.
                Allows the farmer to flag a problem with an outstanding review
                (e.g. they believe the buyer is ignoring their valid evidence).
            ── end ── */}
            {state === "pending" && (
              <button
                onClick={onDispute}
                className="flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-100"
              >
                <ShieldAlert className="h-3.5 w-3.5" /> Dispute
              </button>
            )}
 
            {/* modified code starts here ──────────────────────────────────────
                previous: a single "Mark: X" button that immediately called onUpdate().
                New: "Submit: X" button that expands the evidence panel below.
                The actual submission only fires after a photo is attached.
            ── end ── */}
            {state === "next" && !expanded && (
              <button
                onClick={() => setExpanded(true)}
                className={cn(
                  "flex shrink-0 items-center gap-1.5 rounded-lg border-2 px-4 py-2 text-sm font-semibold transition-all active:scale-95 hover:shadow-sm",
                  step.bgColor, step.borderColor, step.color,
                )}
              >
                <ChevronRight className="h-4 w-4" />
                {step.buttonLabel}
              </button>
            )}
          </div>
        </div>
 
        {/* new code starts here ───────────────────────────────────────────────
            Evidence filename display — shown beneath verified/pending steps.
            Shows the filename and, for verified steps, the verification date.
        ── end ── */}
        {evidence && state !== "next" && (
          <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
            <ImagePlus className="h-3.5 w-3.5" />
            <span className="font-mono">{evidence.photoFileName}</span>
            {evidence.verifiedAt && (
              <span className="ml-1 text-emerald-600">
                · verified {new Date(evidence.verifiedAt).toLocaleDateString("en-PH", { month: "short", day: "numeric" })}
              </span>
            )}
          </div>
        )}
 
        {/* new code starts here ───────────────────────────────────────────────
            Evidence submission panel — expands when the farmer clicks "Submit: X".
            Contains an explanatory note, the PhotoUpload widget, and
            Submit / Cancel buttons. Submit is disabled until a photo is attached.
            This replaces the old single-click "mark complete" behaviour entirely.
        ── end ── */}
        {state === "next" && expanded && (
          <div className="mt-3 rounded-xl border border-border bg-muted/30 p-4 space-y-3">
            <p className="text-sm font-medium text-foreground">
              Submit evidence for <span className={step.color}>{step.label}</span>
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              A photo is required. Your submission will be sent to the buyer for
              co-confirmation before this milestone is marked complete.
              Escrow remains locked until they approve.
            </p>
            <PhotoUpload
              onFileSelected={setPhotoFile}
              fileName={photoFile}
              onClear={() => setPhotoFile(null)}
            />
            <div className="flex gap-2">
              <button
                onClick={handleSubmit}
                disabled={submitting || !photoFile}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#2D6A4F] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1F4A38] active:scale-[0.98] disabled:opacity-50"
              >
                {submitting
                  ? <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  : <Upload className="h-4 w-4" />}
                {submitting ? "Submitting…" : "Submit for Verification"}
              </button>
              <button
                onClick={() => { setExpanded(false); setPhotoFile(null); }}
                className="rounded-lg border border-border px-4 py-2.5 text-sm text-muted-foreground hover:bg-muted"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
 
// ── new code starts here ──────────────────────────────────────────────────────
// DisputeFrozenBanner: shown when contract.disputeFlag = true.
// Replaces the normal timeline to make the frozen state impossible to miss.
// Contains a demo-only "Admin: Resolve Dispute" button that calls resolveDispute()
// in the store, resetting the flag and returning evidence to pending_verification.
function DisputeFrozenBanner({ contractId }: { contractId: string }) {
  const resolveDispute = useAppStore((s) => s.resolveDispute);
  return (
    <div className="rounded-xl border-2 border-red-300 bg-red-50 p-5">
      <div className="flex items-start gap-3">
        <ShieldAlert className="mt-0.5 h-6 w-6 shrink-0 text-red-600" />
        <div className="flex-1">
          <p className="font-semibold text-red-800">Escrow Frozen — Dispute Active</p>
          <p className="mt-1 text-sm text-red-700">
            A dispute has been flagged. Escrow funds are frozen and this case has
            been escalated to PalAI admin. No payouts will be processed until resolved.
          </p>
          <button
            onClick={() => {
              resolveDispute(contractId);
              toast.info("Dispute resolved by admin. Milestone returned to pending review.");
            }}
            className="mt-3 rounded-lg border border-red-300 bg-white px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50"
          >
            [Demo] Admin: Resolve Dispute
          </button>
        </div>
      </div>
    </div>
  );
}
// ── end ───────────────────────────────────────────────────────────────────────
 
// ── new code starts here ──────────────────────────────────────────────────────
// PendingBuyerConfirmationBanner: shown when pendingBuyerConfirmation = true.
// Informs the farmer that their delivery submission is under review and that
// the buyer must confirm before escrow releases — sets correct expectations.
function PendingBuyerConfirmationBanner() {
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
      <div className="flex items-start gap-3">
        <Hourglass className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
        <div>
          <p className="font-semibold text-amber-800">Awaiting Buyer Delivery Confirmation</p>
          <p className="mt-0.5 text-sm text-amber-700">
            You've submitted proof of delivery. The buyer must confirm receipt
            before escrow is released. This typically takes 1–2 business days.
          </p>
        </div>
      </div>
    </div>
  );
}
// ── end ───────────────────────────────────────────────────────────────────────
 
// ── ContractSelector — unchanged ─────────────────────────────────────────────
function ContractSelector({ contracts, selectedId, onSelect }: { contracts: Contract[]; selectedId: string | null; onSelect: (id: string) => void; }) {
  if (contracts.length === 0) return null;
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-muted-foreground">Select Contract</p>
      <div className="flex flex-wrap gap-2">
        {contracts.map((c) => (
          <button key={c.id} onClick={() => onSelect(c.id)}
            className={cn("rounded-lg border px-4 py-2 text-sm font-medium transition-all",
              selectedId === c.id
                ? "border-[#2D6A4F] bg-[#2D6A4F] text-white"
                : "border-border bg-background text-foreground hover:border-[#2D6A4F]/50 hover:bg-accent",
            )}>
            {c.crop} <span className="opacity-60">· {c.volumeKg.toLocaleString()} kg</span>
          </button>
        ))}
      </div>
    </div>
  );
}
 
// ── modified code starts here ─────────────────────────────────────────────────
// previous ProgressBar label: "Overall Progress"
// New label: "Verified Progress" to make clear this only advances on buyer sign-off
function ProgressBar({ progress }: { progress: number }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Verified Progress</span>
        <span className="font-semibold text-foreground">{progress}%</span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-[#2D6A4F] transition-all duration-700 ease-out" style={{ width: `${progress}%` }} />
      </div>
      <p className="text-xs text-muted-foreground">
        Progress only advances after each milestone is co-confirmed by the buyer.
      </p>
    </div>
  );
}
// ── end ───────────────────────────────────────────────────────────────────────
 
// ── modified code starts here ─────────────────────────────────────────────────
// previous export name: MilestoneUpdaterView
// Renamed to: ContractProgress (matches filename and sidebar nav id)
export function ContractProgress() {
// ── end ───────────────────────────────────────────────────────────────────────
 
  const contracts = useAppStore((s) => s.contracts);
 
  // ── modified code starts here ───────────────────────────────────────────────
  // previous selectors: updateCropStatus only
  // New selectors: submitMilestoneEvidence + disputeMilestone
  // updateCropStatus is no longer used here — all progress goes through the
  // verified flow to prevent unilateral escrow unlock.
  const submitMilestoneEvidence = useAppStore((s) => s.submitMilestoneEvidence);
  const disputeMilestone = useAppStore((s) => s.disputeMilestone);
  // ── end ─────────────────────────────────────────────────────────────────────
 
  const activeContracts = contracts.filter((c) =>
    ["accepted", "funded", "in_progress"].includes(c.status),
  );
 
  const [selectedId, setSelectedId] = useState<string | null>(activeContracts[0]?.id ?? null);
 
  // ── new code starts here ───────────────────────────────────────────────────
  // disputingStep tracks which CropStatus the DisputeModal is open for.
  // null = modal closed.
  const [disputingStep, setDisputingStep] = useState<CropStatus | null>(null);
  // ── end ─────────────────────────────────────────────────────────────────────
 
  const selectedContract = contracts.find((c) => c.id === selectedId) ?? null;
  const currentCropStatus = selectedContract?.cropStatus ?? "pending";
 
  // ── new code starts here ──────────────────────────────────────────────────
  // getEvidence: looks up milestoneEvidence for a given CropStatus key.
  const getEvidence = (status: CropStatus) =>
    selectedContract?.milestoneEvidence.find((e) => e.cropStatus === status);
  // ── end ─────────────────────────────────────────────────────────────────────
 
  // ── modified code starts here ───────────────────────────────────────────────
  // previous getStepState returned "done"|"next"|"locked" based only on
  // STATUS_ORDER index comparison against currentCropStatus.
  //
  // New getStepState:
  //   1. Checks milestoneEvidence first — evidence state takes priority
  //   2. "verified"  if evidence.verificationStatus === "verified"
  //   3. "disputed"  if evidence.verificationStatus === "disputed"
  //   4. "pending"   if evidence.verificationStatus === "pending_verification"
  //   5. "next"      if this step is directly after the last verified step
  //   6. "locked"    otherwise
  //
  // This means a farmer cannot skip steps, and a step with unresolved evidence
  // stays in its verification state regardless of what cropStatus is.
  const getStepState = (step: MilestoneStep): "verified" | "pending" | "disputed" | "next" | "locked" => {
    const evidence = getEvidence(step.status);
    if (evidence?.verificationStatus === "verified")             return "verified";
    if (evidence?.verificationStatus === "disputed")             return "disputed";
    if (evidence?.verificationStatus === "pending_verification") return "pending";
 
    const stepOrderIndex = STATUS_ORDER.indexOf(step.status);
    const lastVerifiedIdx = (() => {
      let idx = 0;
      selectedContract?.milestoneEvidence.forEach((e) => {
        if (e.verificationStatus === "verified") {
          idx = Math.max(idx, STATUS_ORDER.indexOf(e.cropStatus));
        }
      });
      return idx;
    })();
 
    if (stepOrderIndex === lastVerifiedIdx + 1) return "next";
    return "locked";
  };
  // ── end ─────────────────────────────────────────────────────────────────────
 
  // ── modified code starts here ───────────────────────────────────────────────
  // previous handleUpdate(step): called updateCropStatus directly.
  // New handleSubmit(step, photoFileName): calls submitMilestoneEvidence.
  // The toast description now explicitly informs the farmer that the buyer
  // must co-confirm before progress advances.
  const handleSubmit = (step: MilestoneStep, photoFileName: string) => {
    if (!selectedId) return;
    submitMilestoneEvidence(selectedId, step.status, photoFileName);
    toast.success("Evidence submitted!", {
      description: `Waiting for ${selectedContract?.buyerName} to co-confirm. Escrow stays locked until then.`,
      duration: 5000,
    });
  };
  // ── end ─────────────────────────────────────────────────────────────────────
 
  // ── new code starts here ──────────────────────────────────────────────────
  // handleDispute: called when the DisputeModal confirms.
  // Routes to disputeMilestone in the store, then closes the modal.
  const handleDispute = (step: MilestoneStep, reason: string) => {
    if (!selectedId) return;
    disputeMilestone(selectedId, step.status, reason);
    setDisputingStep(null);
    toast.error("Dispute raised. Escrow frozen.", {
      description: "An admin has been notified to review this case.",
      duration: 5000,
    });
  };
  // ── end ─────────────────────────────────────────────────────────────────────
 
  if (activeContracts.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="font-display text-2xl font-bold text-foreground">Contract Progress</h2>
          <p className="text-sm text-muted-foreground">
            Update your planting milestones — each requires buyer co-confirmation.
          </p>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <AlertCircle className="h-10 w-10 text-muted-foreground/40" />
            <p className="mt-3 font-medium text-muted-foreground">No active contracts</p>
            <p className="text-sm text-muted-foreground/60">Accept a contract from your inbox to start tracking milestones.</p>
          </CardContent>
        </Card>
      </div>
    );
  }
 
  return (
    <div className="space-y-6">
      {/* new code starts here ─────────────────────────────────────────────────
          DisputeModal rendered at the top level so it can overlay the full view.
          disputingStep drives open/closed state; null = closed.
      ── end ── */}
      {disputingStep && selectedId && (
        <DisputeModal
          cropStatus={disputingStep}
          onConfirm={(reason) => {
            const step = MILESTONES.find((m) => m.status === disputingStep)!;
            handleDispute(step, reason);
          }}
          onCancel={() => setDisputingStep(null)}
        />
      )}
 
      <div>
        <h2 className="font-display text-2xl font-bold text-foreground">Contract Progress</h2>
        {/* modified code starts here ─────────────────────────────────────────
            previous subtitle: "Update your planting milestones — syncs instantly to your buyer's traceability dashboard."
            New subtitle makes the verification requirement explicit.
        ── end ── */}
        <p className="text-sm text-muted-foreground">
          Each milestone requires photo evidence and buyer co-confirmation before
          progress advances. Escrow only releases after delivery is confirmed by both parties.
        </p>
      </div>
 
      {activeContracts.length > 1 && (
        <ContractSelector contracts={activeContracts} selectedId={selectedId} onSelect={setSelectedId} />
      )}
 
      {selectedContract && (
        <>
          {/* Contract summary card — modified: added dispute badge and ProgressBar note */}
          <Card className="border-[#2D6A4F]/20 bg-[#2D6A4F]/5">
            <CardContent className="p-5">
              <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-display text-lg font-bold text-foreground">{selectedContract.crop}</h3>
                  <p className="text-sm text-muted-foreground">
                    {selectedContract.volumeKg.toLocaleString()} kg · {selectedContract.buyerName} · Deliver by {selectedContract.targetDate}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {/* new code starts here ─────────────────────────────────────
                      Dispute badge — appears whenever disputeFlag is true.
                  ── end ── */}
                  {selectedContract.disputeFlag && (
                    <Badge className="border-red-200 bg-red-50 text-red-700">
                      <ShieldAlert className="mr-1 h-3 w-3" /> Disputed
                    </Badge>
                  )}
                  <Badge variant="outline" className="border-[#2D6A4F]/30 text-[#2D6A4F]">
                    {selectedContract.status.replace("_", " ")}
                  </Badge>
                </div>
              </div>
              <ProgressBar progress={selectedContract.progress} />
            </CardContent>
          </Card>
 
          {/* new code starts here ───────────────────────────────────────────────
              Conditional banners — shown instead of the timeline when the
              contract is in a state that requires no further farmer action.
          ── end ── */}
          {selectedContract.disputeFlag && (
            <DisputeFrozenBanner contractId={selectedContract.id} />
          )}
          {selectedContract.pendingBuyerConfirmation && !selectedContract.disputeFlag && (
            <PendingBuyerConfirmationBanner />
          )}
 
          {/* new code starts here ───────────────────────────────────────────────
              Verification legend — quick reference so farmer understands icons.
          ── end ── */}
          {!selectedContract.disputeFlag && (
            <div className="flex flex-wrap gap-3 rounded-lg border border-border bg-muted/30 px-4 py-3 text-xs text-muted-foreground">
              <span className="font-medium text-foreground">Legend:</span>
              <span className="flex items-center gap-1"><ShieldCheck className="h-3.5 w-3.5 text-emerald-600" /> Co-confirmed</span>
              <span className="flex items-center gap-1"><Hourglass className="h-3.5 w-3.5 text-amber-500" /> Awaiting buyer sign-off</span>
              <span className="flex items-center gap-1"><ShieldAlert className="h-3.5 w-3.5 text-red-500" /> Disputed / Frozen</span>
            </div>
          )}
 
          {/* Timeline */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Clock className="h-4 w-4 text-[#2D6A4F]" />
                Milestone Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {MILESTONES.map((step, idx) => {
                const stepState = getStepState(step);
                const evidence = getEvidence(step.status);
                return (
                  <TimelineStep
                    key={step.status}
                    step={step}
                    state={stepState}
                    evidence={evidence}
                    onSubmit={(photoFileName) => handleSubmit(step, photoFileName)}
                    onDispute={() => setDisputingStep(step.status)}
                    isLast={idx === MILESTONES.length - 1}
                  />
                );
              })}
            </CardContent>
          </Card>
 
          {/* modified code starts here ─────────────────────────────────────────
              previous completion check: currentCropStatus === "delivered"
              New check: buyerConfirmedDelivery — because "delivered" cropStatus
              now only means the farmer submitted, not that delivery is confirmed.
              The completion banner should only show after buyer dual sign-off.
          ── end ── */}
          {selectedContract.buyerConfirmedDelivery && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-center">
              <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600" />
              <h3 className="mt-3 font-display text-lg font-bold text-emerald-800">
                Delivery Co-Confirmed!
              </h3>
              <p className="mt-1 text-sm text-emerald-700">
                Both parties have confirmed. Head to <strong>Direct Payout</strong> to receive your payment.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
 
// ── File rename note ──────────────────────────────────────────────────────────
// This file was previously named MilestoneUpdaterView.tsx and exported
// MilestoneUpdaterView. It is now ContractProgress.tsx exporting ContractProgress.
// Update FarmerLayout.tsx import accordingly:
//   import { ContractProgress } from "@/components/farmer/ContractProgress";
// ─────────────────────────────────────────────────────────────────────────────