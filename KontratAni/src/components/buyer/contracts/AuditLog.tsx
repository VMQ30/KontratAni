import { Card } from "@/components/ui/card";
import { CheckCircle2, Leaf, AlertCircle } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";

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

  const entries = contract.matchedCooperative.members
    .filter((farmer) => farmer.smsStatus !== 'pending')
    .map((farmer) => {
      let icon = CheckCircle2;
      let text = `${farmer.name} confirmed action via SMS.`;
      let isLeaf = false;

      if (farmer.smsStatus === 'confirmed') {
        text = `${farmer.name} confirmed daily watering via SMS.`;
      } else if (farmer.smsStatus === 'planted') {
        text = `${farmer.name} confirmed planting via SMS.`;
      } else if (farmer.smsStatus === 'harvested') {
        text = `${farmer.name} reported harvest via SMS.`;
      }

      return {
        icon,
        text,
        time: "Recently",
        isLeaf,
      };
    })
    .slice(0, 5);

  if (entries.length === 0) {
    entries.push({
      icon: Leaf,
      text: "Waiting for farmer confirmations via SMS...",
      time: "Pending",
      isLeaf: true,
    });
  }

  return (
    <Card className="border border-border bg-card p-5 shadow-none">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-body">
        Real-Time Farmer SMS Updates
      </h2>
      <div className="relative pl-6">
        {/* Vertical line */}
        <div className="absolute left-[9px] top-1 h-[calc(100%-8px)] w-px bg-border" />
        <div className="flex flex-col gap-5">
          {entries.map((e, i) => (
            <div key={i} className="relative flex gap-3">
              <div className="absolute -left-6 top-0.5 z-10 flex h-[18px] w-[18px] items-center justify-center rounded-full bg-card">
                <e.icon
                  className={`h-[18px] w-[18px] ${
                    e.isLeaf ? "text-primary" : "text-status-success"
                  }`}
                />
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
