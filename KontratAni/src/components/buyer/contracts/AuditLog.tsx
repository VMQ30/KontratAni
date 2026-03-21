// AuditLog.tsx (Buyer — contracts subfolder)

import { Card } from "@/components/ui/card";
import { CheckCircle2, Leaf,
  // ── NEW: verification icons ─────────────────────────────────────────────────
  ShieldCheck, Hourglass, ShieldAlert,
  // ── END ────────────────────────────────────────────────────────────────────
} from "lucide-react";
// ── MODIFIED: added MilestoneEvidence type to import ─────────────────────────
// previous: import { useAppStore } from "@/store/useAppStore";
import { useAppStore, type MilestoneEvidence } from "@/store/useAppStore";
// ── END ──────────────────────────────────────────────────────────────────────

// ── NEW: helper — map a MilestoneEvidence entry to a display-friendly object
function evidenceToEntry(e: MilestoneEvidence) {
  const cropLabel = e.cropStatus.replace(/_/g, " ");

  if (e.verificationStatus === "verified") {
    return {
      icon: ShieldCheck,
      iconClass: "text-emerald-500",
      text: `${cropLabel} milestone co-confirmed by buyer.`,
      sub: e.verifiedAt
        ? `Verified ${new Date(e.verifiedAt).toLocaleString("en-PH", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}`
        : "Verified",
    };
  }
  if (e.verificationStatus === "disputed") {
    return {
      icon: ShieldAlert,
      iconClass: "text-red-500",
      text: `${cropLabel} milestone disputed — escrow frozen.`,
      sub: e.disputeReason ? `Reason: ${e.disputeReason}` : "Pending admin review",
    };
  }
  // pending_verification
  return {
    icon: Hourglass,
    iconClass: "text-amber-500",
    text: `${cropLabel} evidence submitted by farmer — awaiting buyer sign-off.`,
    sub: e.photoFileName
      ? `Photo: ${e.photoFileName} · ${new Date(e.submittedAt).toLocaleString("en-PH", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}`
      : `Submitted ${new Date(e.submittedAt).toLocaleString("en-PH", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}`,
  };
}
// ── END ──────────────────────────────────────────────────────────────────────

const AuditLog = () => {
  const { contracts, selectedContractId } = useAppStore();
  const contract = contracts.find((c) => c.id === selectedContractId);

  if (!contract || !contract.matchedCooperative) {
    return (
      <Card className="border border-border bg-card p-5 shadow-none">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-body">
          Real-Time Farmer SMS Updates
        </h2>
        <p className="text-xs text-muted-foreground">No cooperative data available</p>
      </Card>
    );
  }

  // ── MODIFIED: build entries from two sources — milestoneEvidence (new) +
  // legacy smsStatus (existing). Milestone evidence entries take priority
  // for any cropStatus key that has evidence; SMS entries fill the rest.
  //
  // previous: entries were derived only from smsStatus on each farmer.
  // ── END ──────────────────────────────────────────────────────────────────────

  // ── NEW: milestone evidence entries (one per evidence record, latest first) ─
  const evidenceEntries = (contract.milestoneEvidence ?? [])
    .slice()
    .reverse() // most recent first
    .map((e) => {
      const mapped = evidenceToEntry(e);
      return {
        icon: mapped.icon,
        iconClass: mapped.iconClass,
        text: mapped.text,
        time: mapped.sub,
        isLeaf: false,
      };
    });
  // ── END ────────────────────────────────────────────────────────────────────

  // ── MODIFIED: original SMS entries kept but filtered to avoid duplication
  // with evidence entries for statuses already covered by milestoneEvidence.
  // previous: all smsStatus !== "pending" farmers produced entries unconditionally.
  const evidenceCropStatuses = new Set(
    (contract.milestoneEvidence ?? []).map((e) => e.cropStatus)
  );

  const smsEntries = contract.matchedCooperative.members
    .filter((farmer) => farmer.smsStatus !== "pending")
    .map((farmer) => {
      let text = `${farmer.name} confirmed action via SMS.`;

      if (farmer.smsStatus === "confirmed") {
        text = `${farmer.name} confirmed daily watering via SMS.`;
      } else if (farmer.smsStatus === "planted") {
        // Only show SMS planted entry if there's no milestoneEvidence for seeds_planted
        if (evidenceCropStatuses.has("seeds_planted")) return null;
        text = `${farmer.name} confirmed planting via SMS.`;
      } else if (farmer.smsStatus === "harvested") {
        if (evidenceCropStatuses.has("harvested")) return null;
        text = `${farmer.name} reported harvest via SMS.`;
      }

      return {
        icon: CheckCircle2,
        iconClass: "text-status-success",
        text,
        time: "Recently",
        isLeaf: false,
      };
    })
    .filter(Boolean) as { icon: any; iconClass: string; text: string; time: string; isLeaf: boolean }[];
  // ── END ────────────────────────────────────────────────────────────────────

  // ── MODIFIED: combined entries — evidence first, then SMS ─────────────────
  // previous: only smsEntries, max 5, with a leaf placeholder when empty.
  const allEntries = [...evidenceEntries, ...smsEntries].slice(0, 8);
  // ── END ────────────────────────────────────────────────────────────────────

  if (allEntries.length === 0) {
    allEntries.push({
      icon: Leaf,
      iconClass: "text-primary",
      text: "Waiting for farmer confirmations via SMS...",
      time: "Pending",
      isLeaf: true,
    });
  }

  return (
    <Card className="border border-border bg-card p-5 shadow-none">
      {/* ── MODIFIED: section title updated to reflect broader scope ─────────────
          previous: "Real-Time Farmer SMS Updates"
      ── END ── */}
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-body">
        Milestone & Verification Log
      </h2>
      <div className="relative pl-6">
        {/* Vertical line */}
        <div className="absolute left-[9px] top-1 h-[calc(100%-8px)] w-px bg-border" />
        <div className="flex flex-col gap-5">
          {allEntries.map((e, i) => (
            <div key={i} className="relative flex gap-3">
              <div className="absolute -left-6 top-0.5 z-10 flex h-[18px] w-[18px] items-center justify-center rounded-full bg-card">
                <e.icon className={`h-[18px] w-[18px] ${e.iconClass}`} />
              </div>
              <div>
                <p className="text-sm leading-snug text-heading">{e.text}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{e.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};

export default AuditLog;