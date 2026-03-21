import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAppStore, CropStatus, Contract } from "@/store/useAppStore";
import {
  Sprout,
  Droplets,
  Sun,
  Scissors,
  Truck,
  CheckCircle2,
  ChevronRight,
  Clock,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
 
// ── Types ─────────────────────────────────────────────────────────────────────
 
interface MilestoneStep {
  status: CropStatus;
  label: string;
  sublabel: string;
  icon: React.ElementType;
  buttonLabel: string;
  progressValue: number;
  color: string;
  bgColor: string;
  borderColor: string;
}
 
// ── Constants ─────────────────────────────────────────────────────────────────
 
const MILESTONES: MilestoneStep[] = [
  {
    status: "seeds_planted",
    label: "Seeds Planted",
    sublabel: "Binhi naitanim na",
    icon: Sprout,
    buttonLabel: "Mark: Seeds Planted",
    progressValue: 25,
    color: "text-emerald-700",
    bgColor: "bg-emerald-50",
    borderColor: "border-emerald-200",
  },
  {
    status: "fertilized",
    label: "Fertilized",
    sublabel: "Pataba nailagay na",
    icon: Droplets,
    buttonLabel: "Mark: Fertilized",
    progressValue: 40,
    color: "text-blue-700",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
  },
  {
    status: "growing",
    label: "Growing",
    sublabel: "Lumalaki na ang tanim",
    icon: Sun,
    buttonLabel: "Mark: Growing",
    progressValue: 60,
    color: "text-amber-700",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-200",
  },
  {
    status: "ready_for_harvest",
    label: "Ready for Harvest",
    sublabel: "Handa na sa ani",
    icon: Scissors,
    buttonLabel: "Mark: Ready for Harvest",
    progressValue: 80,
    color: "text-orange-700",
    bgColor: "bg-orange-50",
    borderColor: "border-orange-200",
  },
  {
    status: "harvested",
    label: "Harvested",
    sublabel: "Na-ani na",
    icon: CheckCircle2,
    buttonLabel: "Mark: Harvested",
    progressValue: 95,
    color: "text-purple-700",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-200",
  },
  {
    status: "delivered",
    label: "Delivered",
    sublabel: "Naihatid na sa buyer",
    icon: Truck,
    buttonLabel: "Mark: Delivered",
    progressValue: 100,
    color: "text-green-700",
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
  },
];
 
const STATUS_ORDER: CropStatus[] = [
  "pending",
  "seeds_planted",
  "fertilized",
  "growing",
  "ready_for_harvest",
  "harvested",
  "delivered",
];
 
// ── Helpers ───────────────────────────────────────────────────────────────────
 
function getStepIndex(status: CropStatus): number {
  return STATUS_ORDER.indexOf(status);
}
 
// ── Sub-components ────────────────────────────────────────────────────────────
 
function ContractSelector({
  contracts,
  selectedId,
  onSelect,
}: {
  contracts: Contract[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  if (contracts.length === 0) return null;
 
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-muted-foreground">Select Contract</p>
      <div className="flex flex-wrap gap-2">
        {contracts.map((c) => (
          <button
            key={c.id}
            onClick={() => onSelect(c.id)}
            className={cn(
              "rounded-lg border px-4 py-2 text-sm font-medium transition-all",
              selectedId === c.id
                ? "border-[#2D6A4F] bg-[#2D6A4F] text-white"
                : "border-border bg-background text-foreground hover:border-[#2D6A4F]/50 hover:bg-accent",
            )}
          >
            {c.crop}{" "}
            <span className="opacity-60">· {c.volumeKg.toLocaleString()} kg</span>
          </button>
        ))}
      </div>
    </div>
  );
}
 
function ProgressBar({ progress }: { progress: number }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Overall Progress</span>
        <span className="font-semibold text-foreground">{progress}%</span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-[#2D6A4F] transition-all duration-700 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
 
function TimelineStep({
  step,
  state,
  onUpdate,
  isLast,
}: {
  step: MilestoneStep;
  state: "done" | "next" | "locked";
  onUpdate: () => void;
  isLast: boolean;
}) {
  const Icon = step.icon;
  const [loading, setLoading] = useState(false);
 
  const handleClick = async () => {
    if (state !== "next") return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 600));
    onUpdate();
    setLoading(false);
  };
 
  return (
    <div className="flex gap-4">
      {/* Spine */}
      <div className="flex flex-col items-center">
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-300",
            state === "done"
              ? "border-[#2D6A4F] bg-[#2D6A4F] text-white"
              : state === "next"
                ? cn(step.bgColor, step.borderColor, step.color)
                : "border-border bg-muted text-muted-foreground/40",
          )}
        >
          {state === "done" ? (
            <CheckCircle2 className="h-5 w-5" />
          ) : (
            <Icon className="h-5 w-5" />
          )}
        </div>
        {!isLast && (
          <div
            className={cn(
              "mt-1 w-0.5 flex-1 transition-colors duration-300",
              state === "done" ? "bg-[#2D6A4F]/40" : "bg-border",
            )}
            style={{ minHeight: 32 }}
          />
        )}
      </div>
 
      {/* Content */}
      <div className="flex-1 pb-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p
              className={cn(
                "font-semibold",
                state === "locked" ? "text-muted-foreground/50" : "text-foreground",
              )}
            >
              {step.label}
            </p>
            <p className="text-sm text-muted-foreground">{step.sublabel}</p>
          </div>
 
          {state === "done" && (
            <Badge className="shrink-0 border-[#2D6A4F]/30 bg-[#2D6A4F]/10 text-[#2D6A4F]">
              ✓ Done
            </Badge>
          )}
 
          {state === "next" && (
            <button
              onClick={handleClick}
              disabled={loading}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-lg border-2 px-4 py-2 text-sm font-semibold transition-all duration-150",
                "active:scale-95 disabled:opacity-60 hover:shadow-sm",
                step.bgColor,
                step.borderColor,
                step.color,
              )}
            >
              {loading ? (
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
              {loading ? "Updating..." : step.buttonLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
 
function BuyerSyncBadge({ synced }: { synced: boolean }) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm",
        synced
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-border bg-muted/50 text-muted-foreground",
      )}
    >
      <div
        className={cn(
          "h-2 w-2 rounded-full",
          synced ? "animate-pulse bg-emerald-500" : "bg-muted-foreground/30",
        )}
      />
      {synced
        ? "Buyer's tracking dashboard updated in real-time"
        : "Awaiting first milestone update"}
    </div>
  );
}
 
// ── Main export ───────────────────────────────────────────────────────────────
 
export function ContractProgress() {
  const contracts = useAppStore((s) => s.contracts);
  const updateCropStatus = useAppStore((s) => s.updateCropStatus);
 
  const activeContracts = contracts.filter((c) =>
    ["accepted", "funded", "in_progress"].includes(c.status),
  );
 
  const [selectedId, setSelectedId] = useState<string | null>(
    activeContracts[0]?.id ?? null,
  );
 
  const selectedContract = contracts.find((c) => c.id === selectedId) ?? null;
  const currentCropStatus = selectedContract?.cropStatus ?? "pending";
  const currentStepIndex = getStepIndex(currentCropStatus);
  const hasSynced = currentCropStatus !== "pending";
 
  const handleUpdate = (step: MilestoneStep) => {
    if (!selectedId) return;
    updateCropStatus(selectedId, step.status);
    toast.success(`Milestone updated: ${step.label}`, {
      description: "Buyer's traceability timeline has been notified. ✓",
      duration: 4000,
    });
  };
 
  if (activeContracts.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="font-display text-2xl font-bold text-foreground">
            Contract Progress
          </h2>
          <p className="text-sm text-muted-foreground">
            Update your planting milestones — syncs instantly to your buyer.
          </p>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <AlertCircle className="h-10 w-10 text-muted-foreground/40" />
            <p className="mt-3 font-medium text-muted-foreground">No active contracts</p>
            <p className="text-sm text-muted-foreground/60">
              Accept a contract from your inbox to start tracking milestones.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }
 
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-foreground">
          Contract Progress
        </h2>
        <p className="text-sm text-muted-foreground">
          Update your planting milestones — syncs instantly to your buyer's
          traceability dashboard.
        </p>
      </div>
 
      {activeContracts.length > 1 && (
        <ContractSelector
          contracts={activeContracts}
          selectedId={selectedId}
          onSelect={setSelectedId}
        />
      )}
 
      {selectedContract && (
        <>
          <Card className="border-[#2D6A4F]/20 bg-[#2D6A4F]/5">
            <CardContent className="p-5">
              <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-display text-lg font-bold text-foreground">
                    {selectedContract.crop}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {selectedContract.volumeKg.toLocaleString()} kg ·{" "}
                    {selectedContract.buyerName} · Deliver by{" "}
                    {selectedContract.targetDate}
                  </p>
                </div>
                <Badge variant="outline" className="border-[#2D6A4F]/30 text-[#2D6A4F]">
                  {selectedContract.status.replace("_", " ")}
                </Badge>
              </div>
              <ProgressBar progress={selectedContract.progress} />
            </CardContent>
          </Card>
 
          <BuyerSyncBadge synced={hasSynced} />
 
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Clock className="h-4 w-4 text-[#2D6A4F]" />
                Milestone Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {MILESTONES.map((step, idx) => {
                const stepOrderIndex = STATUS_ORDER.indexOf(step.status);
                let state: "done" | "next" | "locked" = "locked";
                if (stepOrderIndex <= currentStepIndex) state = "done";
                else if (stepOrderIndex === currentStepIndex + 1) state = "next";
 
                return (
                  <TimelineStep
                    key={step.status}
                    step={step}
                    state={state}
                    onUpdate={() => handleUpdate(step)}
                    isLast={idx === MILESTONES.length - 1}
                  />
                );
              })}
            </CardContent>
          </Card>
 
          {currentCropStatus === "delivered" && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-center">
              <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600" />
              <h3 className="mt-3 font-display text-lg font-bold text-emerald-800">
                Contract Complete!
              </h3>
              <p className="mt-1 text-sm text-emerald-700">
                All milestones fulfilled. Head to <strong>Direct Payout</strong> to
                receive your payment.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}