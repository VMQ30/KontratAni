import { Card } from "@/components/ui/card";
import { Check, Sprout } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";

const stepLabels = [
  { key: "pending", label: "Pending" },
  { key: "seeds_planted", label: "Planted" },
  { key: "fertilized", label: "Fertilized" },
  { key: "growing", label: "Growing" },
  { key: "ready_for_harvest", label: "Ready for Harvest" },
  { key: "harvested", label: "Harvested" },
  { key: "delivered", label: "In Transit" },
];

const MilestoneStepper = () => {
  const { contracts, selectedContractId } = useAppStore();
  const contract = contracts.find((c) => c.id === selectedContractId);
  
  if (!contract) return null;

  const steps = stepLabels.map((step) => {
    const statusIndex = stepLabels.findIndex((s) => s.key === contract.cropStatus);
    const currentIndex = stepLabels.findIndex((s) => s.key === step.key);
    
    return {
      label: step.label,
      done: currentIndex < statusIndex,
      active: currentIndex === statusIndex,
      detail: currentIndex === statusIndex && step.key === "seeds_planted" ? "100% Volume Planted" : undefined,
    };
  });

  return (
    <Card className="border border-border bg-card p-6 shadow-none">
      <h2 className="mb-5 text-sm font-semibold uppercase tracking-wide text-body">
        Crop Journey
      </h2>

      {/* Desktop horizontal */}
      <div className="hidden items-start md:flex">
        {steps.map((s, i) => {
          const completed = s.done;
          const active = !!s.active;
          const upcoming = !completed && !active;
          return (
            <div key={s.label} className="flex flex-1 flex-col items-center">
              <div className="flex w-full items-center">
                {i > 0 && (
                  <div
                    className={`h-1 flex-1 rounded-full ${
                      completed || active ? "bg-primary" : "bg-progress-track"
                    }`}
                  />
                )}
                <div
                  className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                    completed
                      ? "bg-primary text-primary-foreground"
                      : active
                      ? "border-2 border-primary bg-primary/15 text-primary"
                      : "border border-border bg-muted text-muted-foreground"
                  }`}
                >
                  {completed ? (
                    <Check className="h-4 w-4" />
                  ) : active ? (
                    <Sprout className="h-4 w-4" />
                  ) : (
                    i + 1
                  )}
                </div>
                {i < steps.length - 1 && (
                  <div
                    className={`h-1 flex-1 rounded-full ${
                      completed ? "bg-primary" : "bg-progress-track"
                    }`}
                  />
                )}
              </div>
              <span
                className={`mt-2 text-center text-xs font-medium ${
                  upcoming ? "text-muted-foreground" : "text-heading"
                }`}
              >
                {s.label}
              </span>
              {s.detail && (
                <span className="mt-0.5 text-[10px] text-primary">{s.detail}</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Mobile vertical */}
      <div className="flex flex-col gap-0 md:hidden">
        {steps.map((s, i) => {
          const completed = s.done;
          const active = !!s.active;
          return (
            <div key={s.label} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                    completed
                      ? "bg-primary text-primary-foreground"
                      : active
                      ? "border-2 border-primary bg-primary/15 text-primary"
                      : "border border-border bg-muted text-muted-foreground"
                  }`}
                >
                  {completed ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : active ? (
                    <Sprout className="h-3.5 w-3.5" />
                  ) : (
                    i + 1
                  )}
                </div>
                {i < steps.length - 1 && (
                  <div
                    className={`w-0.5 flex-1 ${
                      completed ? "bg-primary" : "bg-progress-track"
                    }`}
                    style={{ minHeight: 24 }}
                  />
                )}
              </div>
              <div className="pb-5">
                <span
                  className={`text-sm font-medium ${
                    completed || active ? "text-heading" : "text-muted-foreground"
                  }`}
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
    </Card>
  );
};

export default MilestoneStepper;
