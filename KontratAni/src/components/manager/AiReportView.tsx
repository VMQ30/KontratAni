import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAppStore } from "@/store/useAppStore";
import {
  FileText,
  BarChart3,
  TrendingUp,
  Loader2,
  Download,
  Leaf,
  Users,
  Banknote,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

type ReportType =
  | "overview"
  | "crop-health"
  | "financial"
  | "farmer-performance";

interface ReportSection {
  title: string;
  icon: React.ReactNode;
  content: string;
  metric?: string;
  status?: "good" | "warning" | "critical";
}

const reportTemplates: Record<
  ReportType,
  { label: string; description: string }
> = {
  overview: {
    label: "Contract Overview",
    description: "Summary of all active contracts, progress, and milestones",
  },
  "crop-health": {
    label: "Crop Health Analysis",
    description: "AI-analyzed soil, weather, and growth projections",
  },
  financial: {
    label: "Financial Summary",
    description: "Escrow balances, payout status, and revenue forecast",
  },
  "farmer-performance": {
    label: "Farmer Performance",
    description:
      "Individual farmer metrics, response rates, and yield estimates",
  },
};

export function AiReportView() {
  const contracts = useAppStore((s) => s.contracts);
  const cooperatives = useAppStore((s) => s.cooperatives);
  const [selectedReport, setSelectedReport] = useState<ReportType>("overview");
  const [generating, setGenerating] = useState(false);
  const [report, setReport] = useState<ReportSection[] | null>(null);

  const coop = cooperatives[0];
  const activeContracts = contracts.filter((c) => c.matchedCooperative);
  const totalEscrow = activeContracts.reduce(
    (sum, c) => sum + c.escrowAmount,
    0,
  );
  const totalVolume = activeContracts.reduce((sum, c) => sum + c.volumeKg, 0);
  const avgProgress =
    activeContracts.length > 0
      ? Math.round(
          activeContracts.reduce((sum, c) => sum + c.progress, 0) /
            activeContracts.length,
        )
      : 0;

  const generateReport = () => {
    setGenerating(true);
    setReport(null);

    setTimeout(() => {
      const reports: Record<ReportType, ReportSection[]> = {
        overview: [
          {
            title: "Contract Portfolio Summary",
            icon: <FileText className="h-4 w-4 text-primary" />,
            content: `Your cooperative currently manages ${activeContracts.length} active forward contracts covering ${totalVolume.toLocaleString()} kg of produce across ${new Set(activeContracts.map((c) => c.crop)).size} crop varieties. The average fulfillment progress stands at ${avgProgress}%, indicating healthy pipeline momentum.`,
            metric: `${activeContracts.length} Active Contracts`,
            status: "good",
          },
          {
            title: "Milestone Tracker",
            icon: <TrendingUp className="h-4 w-4 text-primary" />,
            content: `${activeContracts.filter((c) => c.progress >= 60).length} contracts are past the halfway mark. ${activeContracts.filter((c) => c.cropStatus === "growing" || c.cropStatus === "ready_for_harvest").length} contracts have crops in active growth phase. Projected on-time delivery rate: 94% based on current weather patterns and soil moisture data.`,
            metric: `${avgProgress}% Avg Progress`,
            status: avgProgress >= 50 ? "good" : "warning",
          },
          {
            title: "Risk Assessment",
            icon: <AlertTriangle className="h-4 w-4 text-sand-foreground" />,
            content: `Low risk detected across your portfolio. Weather forecast shows favorable conditions for the next 3 weeks in ${coop.region}. One potential concern: the Onions (Red) contract (c3) is still in "matched" status and needs acceptance to maintain timeline. Recommend prioritizing this contract.`,
            status: "warning",
          },
        ],
        "crop-health": [
          {
            title: "Soil Analysis Summary",
            icon: <Leaf className="h-4 w-4 text-primary" />,
            content: `Soil quality score across your registered land: ${coop.soilScore}/100. The predominant soil types (Loam, Clay Loam, Sandy Loam) show excellent nutrient retention for the contracted crops. pH levels are within optimal range (6.2-6.8). Nitrogen levels are adequate, though phosphorus supplementation is recommended for plots allocated to tomato production.`,
            metric: `${coop.soilScore}/100 Soil Score`,
            status: coop.soilScore >= 85 ? "good" : "warning",
          },
          {
            title: "Weather Impact Forecast",
            icon: <TrendingUp className="h-4 w-4 text-secondary" />,
            content: `Weather suitability index: ${coop.weatherScore}/100. La Niña conditions are weakening, bringing more predictable rainfall patterns. Expected rainfall for the next 30 days: 120-150mm — optimal for rice and vegetable cultivation. No typhoon warnings within the forecast period. UV index is moderate, suitable for all current crop stages.`,
            metric: `${coop.weatherScore}/100 Weather Score`,
            status: coop.weatherScore >= 85 ? "good" : "warning",
          },
          {
            title: "Growth Projections",
            icon: <CheckCircle2 className="h-4 w-4 text-forest" />,
            content: `Based on satellite imagery analysis and historical yield data: Tomatoes are on track for harvest by mid-June with an estimated yield of 5,200 kg (104% of target). Rice (Sinandomeng) shows healthy tillering, projected harvest by late July. Recommend applying foliar fertilizer within the next 7 days for optimal grain fill.`,
            status: "good",
          },
        ],
        financial: [
          {
            title: "Escrow & Revenue Summary",
            icon: <Banknote className="h-4 w-4 text-primary" />,
            content: `Total escrow funds locked: ₱${totalEscrow.toLocaleString()}. This represents advance payments from institutional buyers secured through PalAi's smart escrow system. ${contracts.filter((c) => c.escrowAmount > 0).length} out of ${activeContracts.length} contracts are fully funded. The unfunded contracts represent ₱${activeContracts
              .filter((c) => c.escrowAmount === 0)
              .reduce((s, c) => s + c.volumeKg * 30, 0)
              .toLocaleString()} in potential escrow.`,
            metric: `₱${totalEscrow.toLocaleString()} Locked`,
            status: "good",
          },
          {
            title: "Payout Forecast",
            icon: <TrendingUp className="h-4 w-4 text-sand-foreground" />,
            content: `Estimated payout per farmer upon successful harvest: ₱${(totalEscrow / (coop.members.length || 1)).toLocaleString()} average. GCash and Maya digital wallets are configured for ${coop.members.filter((m) => m.payoutMethod !== "cash").length} out of ${coop.members.length} farmers, enabling instant fund release. Recommended: Convert remaining cash-payout farmers to digital wallets for faster disbursement.`,
            metric: `₱${Math.round(totalEscrow / (coop.members.length || 1)).toLocaleString()} / Farmer`,
            status: "good",
          },
          {
            title: "Revenue vs. Market Comparison",
            icon: <BarChart3 className="h-4 w-4 text-terracotta" />,
            content: `Contract prices are 12-18% above current spot market rates, providing a significant premium for forward commitment. At current market conditions, your cooperative is earning an estimated ₱4.20/kg premium on tomatoes and ₱2.80/kg premium on rice versus farmgate prices. Total estimated premium earnings: ₱${Math.round(totalVolume * 3.5).toLocaleString()}.`,
            status: "good",
          },
        ],
        "farmer-performance": [
          {
            title: "Response & Engagement Rates",
            icon: <Users className="h-4 w-4 text-primary" />,
            content: `SMS response rate across your ${coop.members.length} member farmers: ${Math.round((coop.members.filter((m) => m.smsStatus !== "pending").length / coop.members.length) * 100)}%. Average response time: 2.3 hours. Top responders: ${coop.members
              .slice(0, 2)
              .map((m) => m.name)
              .join(
                ", ",
              )}. Farmers with "pending" status should be contacted via phone call as a backup communication channel.`,
            metric: `${coop.members.length} Farmers`,
            status: "good",
          },
          {
            title: "Yield Estimates by Farmer",
            icon: <BarChart3 className="h-4 w-4 text-forest" />,
            content: `${coop.members.map((m) => `${m.name}: ${m.hectares} ha → est. ${Math.round(m.hectares * 2100)} kg`).join(" | ")}. Total estimated cooperative yield: ${Math.round(coop.totalHectares * 2100).toLocaleString()} kg. This ${totalVolume > 0 ? (Math.round(coop.totalHectares * 2100) >= totalVolume ? "exceeds" : "falls short of") : "relates to"} the contracted volume of ${totalVolume.toLocaleString()} kg.`,
            metric: `${Math.round(coop.totalHectares * 2100).toLocaleString()} kg Est. Yield`,
            status:
              Math.round(coop.totalHectares * 2100) >= totalVolume
                ? "good"
                : "warning",
          },
          {
            title: "Recommendations",
            icon: <CheckCircle2 className="h-4 w-4 text-primary" />,
            content: `1. Schedule a cooperative meeting this week to align on the Onions contract timeline. 2. Provide fertilizer subsidy vouchers to farmers with plots under 2 hectares. 3. Set up a WhatsApp group as secondary communication channel. 4. Consider onboarding 2-3 additional farmers to build harvest buffer capacity for the rice contract.`,
            status: "good",
          },
        ],
      };

      setReport(reports[selectedReport]);
      setGenerating(false);
      toast.success("AI report generated successfully!");
    }, 2500);
  };

  const statusColors = {
    good: "border-primary/30 bg-primary/5",
    warning: "border-sand/40 bg-sand/10",
    critical: "border-destructive/30 bg-destructive/5",
  };

  const statusBadge = {
    good: (
      <Badge
        className="bg-primary/15 text-primary border-primary/30"
        variant="outline"
      >
        Healthy
      </Badge>
    ),
    warning: (
      <Badge
        className="bg-sand/15 text-sand-foreground border-sand/30"
        variant="outline"
      >
        Attention
      </Badge>
    ),
    critical: <Badge variant="destructive">Critical</Badge>,
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-foreground">
          AI Reports & Analytics
        </h2>
        <p className="text-sm text-muted-foreground">
          Generate intelligent reports powered by simulated AI analysis.
        </p>
      </div>

      {/* Report Type Selector */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="flex-1 space-y-2">
              <label className="text-sm font-medium text-foreground">
                Report Type
              </label>
              <Select
                value={selectedReport}
                onValueChange={(v) => setSelectedReport(v as ReportType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(reportTemplates).map(([key, val]) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex flex-col">
                        <span>{val.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {reportTemplates[selectedReport].description}
              </p>
            </div>
            <Button
              onClick={generateReport}
              disabled={generating}
              className="gap-2"
            >
              {generating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <BarChart3 className="h-4 w-4" />
              )}
              {generating ? "Analyzing data..." : "Generate Report"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          {
            label: "Active Contracts",
            value: activeContracts.length,
            icon: <FileText className="h-4 w-4 text-primary" />,
          },
          {
            label: "Total Volume",
            value: `${(totalVolume / 1000).toFixed(0)}t`,
            icon: <TrendingUp className="h-4 w-4 text-forest" />,
          },
          {
            label: "Escrow Locked",
            value: `₱${(totalEscrow / 1000).toFixed(0)}k`,
            icon: <Banknote className="h-4 w-4 text-terracotta" />,
          },
          {
            label: "Avg Progress",
            value: `${avgProgress}%`,
            icon: <BarChart3 className="h-4 w-4 text-secondary" />,
          },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent">
                {s.icon}
              </div>
              <div>
                <p className="font-display text-lg font-bold text-foreground">
                  {s.value}
                </p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Generated Report */}
      <AnimatePresence mode="wait">
        {generating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="mt-4 font-medium text-foreground">
                  Analyzing cooperative data...
                </p>
                <p className="text-sm text-muted-foreground">
                  Processing soil reports, weather patterns, and contract
                  metrics
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {!generating && report && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display text-lg font-semibold text-foreground">
                  {reportTemplates[selectedReport].label}
                </h3>
                <p className="text-xs text-muted-foreground">
                  Generated on{" "}
                  {new Date().toLocaleDateString("en-PH", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => toast.success("Report downloaded as PDF")}
              >
                <Download className="h-3.5 w-3.5" /> Export PDF
              </Button>
            </div>

            {report.map((section, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.15 }}
              >
                <Card
                  className={section.status ? statusColors[section.status] : ""}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2 text-base">
                        {section.icon}
                        {section.title}
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        {section.metric && (
                          <Badge
                            variant="secondary"
                            className="font-mono text-xs"
                          >
                            {section.metric}
                          </Badge>
                        )}
                        {section.status && statusBadge[section.status]}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {section.content}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {!generating && !report && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <BarChart3 className="h-10 w-10 text-muted-foreground/30" />
            <p className="mt-3 font-medium text-muted-foreground">
              Select a report type and click Generate
            </p>
            <p className="text-sm text-muted-foreground/60">
              AI will analyze your cooperative's data and produce actionable
              insights.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
