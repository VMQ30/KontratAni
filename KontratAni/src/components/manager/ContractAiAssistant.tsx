// ContractAiAssistant.tsx (Manager)

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerClose,
} from '@/components/ui/drawer';
import { useAppStore, type Contract } from '@/store/useAppStore';
import {
  Brain, AlertTriangle, Clock, Sprout, CheckCircle2, CalendarClock,
  Package, TrendingUp, X, Sparkles, Leaf, Timer,
  // ── NEW: verification-state icons ──────────────────────────────────────────
  ShieldAlert, Hourglass, ShieldCheck,
  // ── END ────────────────────────────────────────────────────────────────────
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const GROWTH_DAYS: Record<string, number> = {
  'Tomatoes': 75,
  'Rice (Sinandomeng)': 120,
  'Onions (Red)': 100,
  'Corn': 90,
  'Wheat': 120,
  'Soybeans': 100,
  'Eggplant': 80,
  'Cabbage': 70,
  'Carrots': 80,
  'Potatoes': 90,
};

const BUFFER_DAYS = 7;

interface ContractInsight {
  contract: Contract;
  daysRemaining: number;
  isUrgent: boolean;
  mustPlantBy: Date;
  pastPlantingWindow: boolean;
  growthDays: number;
  timeElapsedPercent: number;
  growthPercent: number;
}

function getInsight(contract: Contract): ContractInsight {
  const now = new Date();
  const deadline = new Date(contract.targetDate);
  const daysRemaining = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const isUrgent = daysRemaining <= 14 && daysRemaining > 0;

  const growthDays = GROWTH_DAYS[contract.crop] ?? 90;
  const mustPlantBy = new Date(deadline.getTime() - (growthDays + BUFFER_DAYS) * 24 * 60 * 60 * 1000);
  const isPlanted = !['pending'].includes(contract.cropStatus);
  const pastPlantingWindow = now >= mustPlantBy && !isPlanted;

  const createdAt = new Date(contract.createdAt);
  const totalDuration = deadline.getTime() - createdAt.getTime();
  const elapsed = now.getTime() - createdAt.getTime();
  const timeElapsedPercent = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
  const growthPercent = Math.min(100, Math.max(0, (contract.progress / 100) * 100));

  return {
    contract, daysRemaining, isUrgent, mustPlantBy,
    pastPlantingWindow, growthDays, timeElapsedPercent, growthPercent,
  };
}

// ── MODIFIED: statusBadge now handles pending_verification and disputed states
// previous: no cases for these — they would fall through to the default
// outline badge showing the raw cropStatus string, which is confusing.
function statusBadge(status: string, contract?: Contract) {
  // ── NEW: check verification state first — takes priority over cropStatus ────
  if (contract) {
    if (contract.disputeFlag) {
      return (
        <Badge className="border-red-200 bg-red-50 text-red-700">
          <ShieldAlert className="mr-1 h-3 w-3" /> Disputed
        </Badge>
      );
    }
    const hasPending = contract.milestoneEvidence?.some(
      e => e.verificationStatus === 'pending_verification'
    );
    if (hasPending) {
      return (
        <Badge className="border-amber-200 bg-amber-50 text-amber-700">
          <Hourglass className="mr-1 h-3 w-3" /> Awaiting Sign-off
        </Badge>
      );
    }
  }
  // ── END ────────────────────────────────────────────────────────────────────

  switch (status) {
    case 'pending':
      return <Badge className="bg-muted text-muted-foreground border border-border">Pending</Badge>;
    case 'seeds_planted':
      return <Badge className="bg-primary/15 text-primary border border-primary/30">Planted</Badge>;
    case 'growing':
    case 'fertilized':
      return <Badge className="bg-forest/15 text-forest border border-forest/30">Growing</Badge>;
    case 'ready_for_harvest':
      return <Badge className="bg-sand/30 text-sand-foreground border border-sand/50">Ready</Badge>;
    case 'harvested':
      return <Badge className="bg-forest/20 text-forest border border-forest/40">Harvested</Badge>;
    case 'delivered':
      // ── MODIFIED: delivered now checks buyerConfirmedDelivery to distinguish
      // "submitted but unconfirmed" from "fully verified delivery"
      // previous: always showed "Delivered" for this status
      return contract?.buyerConfirmedDelivery
        ? <Badge className="bg-primary text-primary-foreground"><ShieldCheck className="mr-1 h-3 w-3" />Delivered & Verified</Badge>
        : <Badge className="bg-primary/20 text-primary border border-primary/30">Delivered (Unconfirmed)</Badge>;
      // ── END ──────────────────────────────────────────────────────────────────
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}
// ── END ──────────────────────────────────────────────────────────────────────

export function ContractAiAssistant() {
  const contracts = useAppStore((s) => s.contracts);
  const [selectedInsight, setSelectedInsight] = useState<ContractInsight | null>(null);
  const [aiThinking, setAiThinking] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setAiThinking(false), 1200);
    return () => clearTimeout(t);
  }, []);

  const activeContracts = contracts.filter(c => c.status !== 'completed');
  const insights = useMemo(() => activeContracts.map(getInsight), [activeContracts]);

  const pendingPlanting = insights.filter(i => i.contract.cropStatus === 'pending').length;
  const approachingDeadlines = insights.filter(i => i.isUrgent).length;
  const criticalAlerts = insights.filter(i => i.pastPlantingWindow);

  // ── NEW: verification-aware counts for summary cards ─────────────────────
  const disputedCount = activeContracts.filter(c => c.disputeFlag).length;
  const awaitingSignOffCount = activeContracts.filter(c =>
    !c.disputeFlag && c.milestoneEvidence?.some(e => e.verificationStatus === 'pending_verification')
  ).length;
  // ── END ────────────────────────────────────────────────────────────────────

  useEffect(() => {
    localStorage.setItem('kontratani_ai_last_analysis', new Date().toISOString());
  }, [insights]);

  if (aiThinking) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}>
          <Brain className="h-10 w-10 text-primary" />
        </motion.div>
        <p className="text-sm font-medium text-muted-foreground">AI Agent analyzing contracts…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <Brain className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="font-display text-2xl font-bold text-foreground">AI Contract Tracker</h2>
          <p className="text-sm text-muted-foreground">Intelligent insights on deadlines, planting windows & contract health.</p>
        </div>
      </div>

      {/* Critical Alerts — unchanged */}
      <AnimatePresence>
        {criticalAlerts.map((i) => (
          <motion.div key={i.contract.id} initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <Alert className="border-destructive/50 bg-destructive/5">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <AlertTitle className="text-destructive font-semibold">
                Action Required: Plant {i.contract.crop} Now!
              </AlertTitle>
              <AlertDescription className="text-destructive/80">
                The planting window closed on {i.mustPlantBy.toLocaleDateString()}. You must plant immediately to meet the {i.contract.targetDate} deadline.
              </AlertDescription>
            </Alert>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* ── NEW: verification alerts — disputed and awaiting sign-off ─────────── */}
      {disputedCount > 0 && (
        <Alert className="border-red-300 bg-red-50">
          <ShieldAlert className="h-4 w-4 text-red-600" />
          <AlertTitle className="text-red-800 font-semibold">
            {disputedCount} Contract{disputedCount > 1 ? 's' : ''} Under Dispute
          </AlertTitle>
          <AlertDescription className="text-red-700">
            Escrow is frozen on {disputedCount} contract{disputedCount > 1 ? 's' : ''}. PalAI admin has been notified. No payouts can be distributed until resolved.
          </AlertDescription>
        </Alert>
      )}
      {awaitingSignOffCount > 0 && (
        <Alert className="border-amber-200 bg-amber-50">
          <Hourglass className="h-4 w-4 text-amber-600" />
          <AlertTitle className="text-amber-800 font-semibold">
            {awaitingSignOffCount} Milestone{awaitingSignOffCount > 1 ? 's' : ''} Awaiting Buyer Sign-off
          </AlertTitle>
          <AlertDescription className="text-amber-700">
            Farmer evidence has been submitted and is waiting for buyer co-confirmation. Escrow remains locked until approved.
          </AlertDescription>
        </Alert>
      )}
      {/* ── END ────────────────────────────────────────────────────────────────── */}

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <Package className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Active Contracts</p>
              <p className="text-2xl font-bold text-foreground">{activeContracts.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-sand/20">
              <Sprout className="h-5 w-5 text-terracotta" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pending Planting</p>
              <p className="text-2xl font-bold text-foreground">{pendingPlanting}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${approachingDeadlines > 0 ? 'bg-destructive/10' : 'bg-forest/10'}`}>
              <CalendarClock className={`h-5 w-5 ${approachingDeadlines > 0 ? 'text-destructive' : 'text-forest'}`} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Approaching Deadlines</p>
              <p className="text-2xl font-bold text-foreground">{approachingDeadlines}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Contract Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-4 w-4 text-primary" /> Contract Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Crop</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead>Deadline</TableHead>
                {/* ── MODIFIED: renamed "Status" column to "Crop / Verification" ──
                    previous: <TableHead>Status</TableHead>
                ── END ── */}
                <TableHead>Crop / Verification</TableHead>
                <TableHead>Days Left</TableHead>
                <TableHead className="text-right">Progress</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {insights.map((insight) => (
                <TableRow
                  key={insight.contract.id}
                  className="cursor-pointer transition-colors hover:bg-accent/50"
                  onClick={() => setSelectedInsight(insight)}
                >
                  <TableCell className="font-medium">{insight.contract.buyerName}</TableCell>
                  <TableCell>{insight.contract.crop}</TableCell>
                  <TableCell className="text-right">{insight.contract.volumeKg.toLocaleString()} kg</TableCell>
                  <TableCell>{insight.contract.targetDate}</TableCell>
                  {/* ── MODIFIED: pass contract to statusBadge for verification awareness ─
                      previous: statusBadge(insight.contract.cropStatus)
                  ── END ── */}
                  <TableCell>{statusBadge(insight.contract.cropStatus, insight.contract)}</TableCell>
                  <TableCell>
                    <span className={`flex items-center gap-1.5 font-medium ${insight.daysRemaining <= 0 ? 'text-destructive' : insight.isUrgent ? 'text-terracotta' : 'text-foreground'}`}>
                      {insight.isUrgent && <AlertTriangle className="h-3.5 w-3.5" />}
                      {insight.daysRemaining <= 0 ? 'Overdue' : `${insight.daysRemaining}d`}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center gap-2 justify-end">
                      <div className="w-20">
                        <Progress value={insight.growthPercent} className="h-2" />
                      </div>
                      <span className="text-xs text-muted-foreground w-8">{Math.round(insight.growthPercent)}%</span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {insights.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                    No active contracts to analyze.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* AI Recommendations */}
      <Card className="border-primary/20 bg-primary/[0.03]">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base text-primary">
            <Brain className="h-4 w-4" /> AI Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {insights.map((i) => (
            <div key={i.contract.id} className="flex items-start gap-3 rounded-lg border border-border/50 bg-card p-3">
              {i.contract.disputeFlag ? (
                <ShieldAlert className="h-4 w-4 mt-0.5 shrink-0 text-red-500" />
              ) : i.contract.milestoneEvidence?.some(e => e.verificationStatus === 'pending_verification') ? (
                <Hourglass className="h-4 w-4 mt-0.5 shrink-0 text-amber-500" />
              ) : i.pastPlantingWindow ? (
                <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0 text-destructive" />
              ) : i.isUrgent ? (
                <Timer className="h-4 w-4 mt-0.5 shrink-0 text-terracotta" />
              ) : (
                <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0 text-forest" />
              )}
              <div className="text-sm">
                <span className="font-semibold text-foreground">{i.contract.crop}</span>
                {/* ── NEW: dispute / pending_verification recommendations ─────── */}
                {i.contract.disputeFlag ? (
                  <span className="text-red-600"> — DISPUTED: Escrow frozen. Awaiting admin resolution before any payouts.</span>
                ) : i.contract.milestoneEvidence?.some(e => e.verificationStatus === 'pending_verification') ? (
                  <span className="text-amber-600"> — Milestone evidence submitted. Escrow held until buyer co-confirms.</span>
                ) : i.pastPlantingWindow ? (
                // ── END ──────────────────────────────────────────────────────────
                  <span className="text-destructive"> — CRITICAL: Planting window has passed! Must plant immediately to avoid contract breach.</span>
                ) : i.contract.cropStatus === 'pending' ? (
                  <span className="text-muted-foreground"> — Must plant by <span className="font-medium text-terracotta">{i.mustPlantBy.toLocaleDateString()}</span> ({i.growthDays} growth days + {BUFFER_DAYS}d buffer required).</span>
                ) : i.isUrgent ? (
                  <span className="text-terracotta"> — Deadline approaching in {i.daysRemaining} days. Monitor closely and prepare for harvest.</span>
                ) : (
                  <span className="text-muted-foreground"> — On track. {i.daysRemaining} days remaining with {Math.round(i.growthPercent)}% growth progress.</span>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Detail Drawer */}
      <Drawer open={!!selectedInsight} onOpenChange={(open) => !open && setSelectedInsight(null)}>
        <DrawerContent className="max-h-[85vh]">
          {selectedInsight && (
            <div className="mx-auto w-full max-w-lg overflow-y-auto px-4 pb-8">
              <DrawerHeader className="px-0">
                <div className="flex items-center justify-between">
                  <DrawerTitle className="font-display text-xl">
                    {selectedInsight.contract.crop} — Contract Details
                  </DrawerTitle>
                  <DrawerClose asChild>
                    <Button variant="ghost" size="icon"><X className="h-4 w-4" /></Button>
                  </DrawerClose>
                </div>
                <DrawerDescription>
                  AI-powered analysis for contract {selectedInsight.contract.id}
                </DrawerDescription>
              </DrawerHeader>

              <div className="space-y-5 mt-2">
                {/* Status Badges */}
                <div className="flex flex-wrap gap-2">
                  {/* ── MODIFIED: use updated statusBadge with contract reference ─
                      previous: statusBadge(selectedInsight.contract.cropStatus)
                  ── END ── */}
                  {statusBadge(selectedInsight.contract.cropStatus, selectedInsight.contract)}
                  {selectedInsight.isUrgent && (
                    <Badge className="bg-destructive/10 text-destructive border border-destructive/30">
                      <AlertTriangle className="h-3 w-3 mr-1" /> Urgent
                    </Badge>
                  )}
                  {selectedInsight.pastPlantingWindow && (
                    <Badge className="bg-destructive text-destructive-foreground">
                      Planting Overdue
                    </Badge>
                  )}
                  {/* ── NEW: dispute and pending badges in drawer ─────────────── */}
                  {selectedInsight.contract.disputeFlag && (
                    <Badge className="border-red-200 bg-red-50 text-red-700">
                      <ShieldAlert className="h-3 w-3 mr-1" /> Escrow Frozen
                    </Badge>
                  )}
                  {!selectedInsight.contract.disputeFlag && selectedInsight.contract.pendingBuyerConfirmation && (
                    <Badge className="border-amber-200 bg-amber-50 text-amber-700">
                      <Hourglass className="h-3 w-3 mr-1" /> Awaiting Buyer
                    </Badge>
                  )}
                  {selectedInsight.contract.buyerConfirmedDelivery && (
                    <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700">
                      <ShieldCheck className="h-3 w-3 mr-1" /> Delivery Confirmed
                    </Badge>
                  )}
                  {/* ── END ────────────────────────────────────────────────────── */}
                </div>

                {/* Key Details — unchanged */}
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Client', value: selectedInsight.contract.buyerName },
                    { label: 'Volume', value: `${selectedInsight.contract.volumeKg.toLocaleString()} kg` },
                    { label: 'Deadline', value: selectedInsight.contract.targetDate },
                    { label: 'Days Remaining', value: selectedInsight.daysRemaining <= 0 ? 'Overdue' : `${selectedInsight.daysRemaining} days` },
                    { label: 'Growth Period', value: `${selectedInsight.growthDays} days` },
                    { label: 'Must Plant By', value: selectedInsight.mustPlantBy.toLocaleDateString() },
                    { label: 'Escrow Amount', value: `₱${selectedInsight.contract.escrowAmount.toLocaleString()}` },
                    { label: 'Contract Status', value: selectedInsight.contract.status.replace('_', ' ') },
                  ].map((item) => (
                    <div key={item.label} className="rounded-lg border border-border bg-muted/30 p-3">
                      <p className="text-xs text-muted-foreground">{item.label}</p>
                      <p className="font-semibold text-sm text-foreground">{item.value}</p>
                    </div>
                  ))}
                </div>

                {/* Timeline Progress — unchanged */}
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-primary" /> Timeline & Growth Progress
                  </h4>
                  <div className="space-y-2">
                    <div>
                      <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span>Time Elapsed</span>
                        <span>{Math.round(selectedInsight.timeElapsedPercent)}%</span>
                      </div>
                      <Progress value={selectedInsight.timeElapsedPercent} className="h-2.5" />
                    </div>
                    <div>
                      <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        {/* ── MODIFIED: label clarifies this is verified-only progress ─
                            previous: <span>Growth Progress</span>
                        ── END ── */}
                        <span>Verified Growth Progress</span>
                        <span>{Math.round(selectedInsight.growthPercent)}%</span>
                      </div>
                      <div className="h-2.5 w-full overflow-hidden rounded-full bg-secondary">
                        <div
                          className={`h-full rounded-full transition-all ${
                            selectedInsight.growthPercent < selectedInsight.timeElapsedPercent - 15
                              ? 'bg-destructive'
                              : selectedInsight.growthPercent < selectedInsight.timeElapsedPercent
                              ? 'bg-terracotta'
                              : 'bg-forest'
                          }`}
                          style={{ width: `${selectedInsight.growthPercent}%` }}
                        />
                      </div>
                    </div>
                  </div>
                  {selectedInsight.growthPercent < selectedInsight.timeElapsedPercent - 15 && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      Growth is significantly behind schedule. Immediate action recommended.
                    </p>
                  )}
                </div>

                {/* AI Summary */}
                <div className="rounded-lg border border-primary/20 bg-primary/[0.03] p-4">
                  <h4 className="text-sm font-semibold text-primary flex items-center gap-2 mb-2">
                    <Sparkles className="h-4 w-4" /> AI Assessment
                  </h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {/* ── NEW: assessment cases for dispute and pending verification ─ */}
                    {selectedInsight.contract.disputeFlag
                      ? `This contract is under active dispute. Escrow of ₱${selectedInsight.contract.escrowAmount.toLocaleString()} is frozen pending admin resolution. No field or financial actions can proceed until resolved.`
                      : selectedInsight.contract.pendingBuyerConfirmation
                      ? `Delivery evidence has been submitted by the farmer. Waiting on buyer co-confirmation to unlock escrow. This is the final verification step before payout can be distributed.`
                      // ── END ──────────────────────────────────────────────────────
                      : selectedInsight.pastPlantingWindow
                      ? `This contract is at critical risk. The optimal planting window was ${selectedInsight.mustPlantBy.toLocaleDateString()}, which has already passed. Immediate planting is required with accelerated growth protocols to meet the ${selectedInsight.contract.targetDate} delivery deadline.`
                      : selectedInsight.isUrgent
                      ? `This contract requires close monitoring. With only ${selectedInsight.daysRemaining} days remaining, ensure all field operations are on schedule. The cooperative should prioritize harvest preparations and logistics coordination.`
                      : selectedInsight.contract.cropStatus === 'pending'
                      ? `This contract is awaiting planting. The recommended planting date is before ${selectedInsight.mustPlantBy.toLocaleDateString()} to ensure a ${selectedInsight.growthDays}-day growth cycle plus ${BUFFER_DAYS}-day buffer. Assign farmers and begin soil preparation.`
                      : `This contract is progressing well at ${Math.round(selectedInsight.growthPercent)}% verified completion with ${selectedInsight.daysRemaining} days to deadline. Continue monitoring field conditions and maintain current pace.`
                    }
                  </p>
                </div>

                {/* Cooperative Info — unchanged */}
                {selectedInsight.contract.matchedCooperative && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <Leaf className="h-4 w-4 text-forest" /> Assigned Cooperative
                    </h4>
                    <div className="rounded-lg border border-border bg-muted/30 p-3">
                      <p className="font-semibold text-sm">{selectedInsight.contract.matchedCooperative.name}</p>
                      <p className="text-xs text-muted-foreground">{selectedInsight.contract.matchedCooperative.region} • {selectedInsight.contract.matchedCooperative.totalHectares} hectares</p>
                      <div className="flex gap-3 mt-2">
                        <span className="text-xs">Soil: <span className="font-medium text-forest">{selectedInsight.contract.matchedCooperative.soilScore}/100</span></span>
                        <span className="text-xs">Weather: <span className="font-medium text-primary">{selectedInsight.contract.matchedCooperative.weatherScore}/100</span></span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </DrawerContent>
      </Drawer>
    </div>
  );
}