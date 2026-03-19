import { Card } from "@/components/ui/card";
import { TrendingUp, CalendarDays, CloudSun } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAppStore } from "@/store/useAppStore";

const MetricCards = () => {
  const { contracts, selectedContractId } = useAppStore();
  const contract = contracts.find((c) => c.id === selectedContractId);

  if (!contract) return null;

  const targetDate = new Date(contract.targetDate);
  const today = new Date();
  const daysUntilDelivery = Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  const metrics = [
    {
      label: "Expected Yield",
      value: `${contract.volumeKg.toLocaleString()} kg`,
      sub: `Target: ${(contract.volumeKg / 1000).toFixed(1)}t`,
      icon: TrendingUp,
    },
    {
      label: "Estimated Delivery",
      value: `${Math.max(1, daysUntilDelivery)} Days`,
      sub: `Target: ${contract.targetDate}`,
      icon: CalendarDays,
    },
  ];

  const getWeatherRisk = () => {
    if (!contract.matchedCooperative) return { text: "No Data", color: "bg-muted text-muted-foreground" };
    const score = contract.matchedCooperative.weatherScore;
    if (score >= 85) return { text: "Low Risk", color: "bg-status-success/15 text-status-success" };
    if (score >= 70) return { text: "Moderate Risk", color: "bg-yellow-500/15 text-yellow-700" };
    return { text: "High Risk", color: "bg-red-500/15 text-red-700" };
  };

  const weatherRisk = getWeatherRisk();

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {metrics.map((m) => (
        <Card
          key={m.label}
          className="flex items-start gap-4 border border-border bg-card p-5 shadow-none transition-colors duration-150 hover:bg-muted/40"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <m.icon className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-body">
              {m.label}
            </p>
            <p className="mt-1 text-2xl font-semibold text-heading">{m.value}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{m.sub}</p>
          </div>
        </Card>
      ))}

      {/* Weather Risk card */}
      <Card className="flex items-start gap-4 border border-border bg-card p-5 shadow-none transition-colors duration-150 hover:bg-muted/40">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <CloudSun className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-body">
            Weather Risk
          </p>
          <Badge className={`mt-1.5 ${weatherRisk.color} shadow-none hover:${weatherRisk.color}`}>
            {weatherRisk.text}
          </Badge>
          <p className="mt-1 text-xs text-muted-foreground">
            {contract.matchedCooperative 
              ? `Weather score: ${contract.matchedCooperative.weatherScore}/100`
              : "No cooperative data available"}
          </p>
        </div>
      </Card>
    </div>
  );
};

export default MetricCards;
