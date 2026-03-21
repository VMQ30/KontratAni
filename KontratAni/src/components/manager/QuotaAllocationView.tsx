import { useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { useAppStore } from '@/store/useAppStore';
import { Sliders, Check, AlertTriangle, RefreshCw, Lock } from 'lucide-react';
import { toast } from 'sonner';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const KG_PER_HA = 1000;

/**
 * 50% of total quota is split equally among all members (Pool A — the floor).
 * The other 50% is distributed proportionally by land area (Pool B — the bonus).
 */
const BASE_SPLIT = 0.5;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AllocationBreakdown {
  base: number;
  bonus: number;
  total: number;
}

// ---------------------------------------------------------------------------
// Algorithm
// ---------------------------------------------------------------------------

function distribute(
  farmers: { id: string; hectares: number }[],
  totalKg: number
): Record<string, AllocationBreakdown> {
  if (farmers.length === 0) return {};
  const cap = (f: { hectares: number }) => Math.floor(f.hectares * KG_PER_HA);
  const result: Record<string, AllocationBreakdown> = {};

  const basePool = Math.floor(totalKg * BASE_SPLIT);
  const equalBase = Math.floor(basePool / farmers.length);
  farmers.forEach((f) => {
    const base = Math.min(equalBase, cap(f));
    result[f.id] = { base, bonus: 0, total: base };
  });

  let bonusPool = totalKg - farmers.reduce((s, f) => s + result[f.id].base, 0);
  let iters = 20;
  while (bonusPool >= 1 && iters-- > 0) {
    const eligible = farmers.filter((f) => result[f.id].total < cap(f));
    if (eligible.length === 0) break;
    const totalHa = eligible.reduce((s, f) => s + f.hectares, 0);
    if (totalHa === 0) break;
    let used = 0, overflow = 0;
    eligible.forEach((f) => {
      const want = Math.floor((f.hectares / totalHa) * bonusPool);
      const room = cap(f) - result[f.id].total;
      const actual = Math.min(want, room);
      result[f.id].bonus += actual;
      result[f.id].total += actual;
      used += actual;
      overflow += want - actual;
    });
    bonusPool = bonusPool - used + overflow;
  }
  return result;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function QuotaAllocationView() {
  const contracts = useAppStore((s) => s.contracts);
  const acceptedContracts = contracts.filter(
    (c) => ['accepted', 'funded', 'in_progress'].includes(c.status) && c.matchedCooperative
  );

  const [selectedId, setSelectedId] = useState<string | null>(acceptedContracts[0]?.id || null);
  const contract = acceptedContracts.find((c) => c.id === selectedId);
  const farmers = contract?.matchedCooperative?.members || [];

  const [breakdowns, setBreakdowns] = useState<Record<string, AllocationBreakdown>>(() =>
    contract ? distribute(farmers, contract.volumeKg) : {}
  );
  const [inputText, setInputText] = useState<Record<string, string>>({});
  const [focusedId, setFocusedId] = useState<string | null>(null);

  const targetKg = contract?.volumeKg || 0;
  const totalAllocated = Object.values(breakdowns).reduce((s, b) => s + b.total, 0);
  const remaining = targetKg - totalAllocated;
  const progressPct = Math.min((totalAllocated / Math.max(targetKg, 1)) * 100, 100);
  const basePool = Math.floor(targetKg * BASE_SPLIT);
  const equalBase = farmers.length > 0 ? Math.floor(basePool / farmers.length) : 0;
  const totalHa = farmers.reduce((s, f) => s + f.hectares, 0);

  const handleReset = useCallback(() => {
    if (!contract) return;
    setBreakdowns(distribute(farmers, contract.volumeKg));
    setInputText({});
    setFocusedId(null);
    toast.success('Reset to fair distribution.');
  }, [contract, farmers]);

  const handleSelectContract = (id: string) => {
    setSelectedId(id);
    const c = acceptedContracts.find((c) => c.id === id);
    if (!c) return;
    setBreakdowns(distribute(c.matchedCooperative?.members || [], c.volumeKg));
    setInputText({});
    setFocusedId(null);
  };

  const setTotal = (farmerId: string, value: number) => {
    const farmer = farmers.find((f) => f.id === farmerId);
    if (!farmer) return;
    const maxKg = Math.floor(farmer.hectares * KG_PER_HA);
    const base = breakdowns[farmerId]?.base ?? 0;
    const clamped = Math.max(base, Math.min(Math.round(value), maxKg));
    setBreakdowns((prev) => ({
      ...prev,
      [farmerId]: { base: prev[farmerId].base, bonus: Math.max(0, clamped - prev[farmerId].base), total: clamped },
    }));
  };

  const handleSlider = (farmerId: string, value: number[]) => {
    setTotal(farmerId, value[0]);
    if (focusedId !== farmerId) {
      setInputText((prev) => ({ ...prev, [farmerId]: String(value[0]) }));
    }
  };

  const handleTextChange = (farmerId: string, raw: string) =>
    setInputText((prev) => ({ ...prev, [farmerId]: raw }));

  const handleTextBlur = (farmerId: string) => {
    const parsed = parseInt(inputText[farmerId] ?? '', 10);
    if (!isNaN(parsed)) setTotal(farmerId, parsed);
    setInputText((prev) => ({
      ...prev,
      [farmerId]: String(
        isNaN(parsed)
          ? breakdowns[farmerId]?.total ?? 0
          : Math.max(
              breakdowns[farmerId]?.base ?? 0,
              Math.min(
                Math.round(parsed),
                Math.floor((farmers.find((f) => f.id === farmerId)?.hectares ?? 0) * KG_PER_HA)
              )
            )
      ),
    }));
    setFocusedId(null);
  };

  const handleConfirm = () => {
    if (remaining < 0) {
      toast.error(`Over-allocated by ${Math.abs(remaining).toLocaleString()} kg. Reduce assignments first.`);
      return;
    }
    if (remaining > 0) {
      toast.error(`${remaining.toLocaleString()} kg still unassigned. Distribute all quota before confirming.`);
      return;
    }
    toast.success(`Quota confirmed for ${contract?.crop}. Ready for SMS broadcast.`);
  };

  // ── Empty state ────────────────────────────────────────────────────────────
  if (acceptedContracts.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="font-display text-2xl font-bold text-foreground">Quota Allocation</h2>
          <p className="text-sm text-muted-foreground">Distribute production quotas fairly across co-op members.</p>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Sliders className="h-10 w-10 text-muted-foreground/40" />
            <p className="mt-3 font-medium text-muted-foreground">No accepted contracts yet</p>
            <p className="text-sm text-muted-foreground/60">Accept a contract from the inbox first.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-foreground">Quota Allocation</h2>
          <p className="text-sm text-muted-foreground">
            Every member gets an equal base share, plus a land-area bonus.
          </p>
        </div>
        <Button variant="outline" size="sm" className="mt-1 shrink-0 gap-2" onClick={handleReset}>
          <RefreshCw className="h-3.5 w-3.5" />
          Reset
        </Button>
      </div>

      {/* Contract tabs */}
      {acceptedContracts.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {acceptedContracts.map((c) => (
            <Button
              key={c.id}
              variant={selectedId === c.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleSelectContract(c.id)}
            >
              {c.crop}
            </Button>
          ))}
        </div>
      )}

      {contract && (
        <>
          {/* Formula banner */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-border bg-muted/40 p-4">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">A</span>
                <p className="text-sm font-semibold text-foreground">Equal base</p>
                <Badge variant="secondary" className="ml-auto text-xs">50% of quota</Badge>
              </div>
              <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                Divided equally among all {farmers.length} members. Same amount for everyone — no one is left out.
              </p>
              <p className="mt-2 font-mono text-sm font-bold text-primary">
                {equalBase.toLocaleString()} kg <span className="font-normal text-muted-foreground">/ member</span>
              </p>
            </div>
            <div className="rounded-xl border border-border bg-muted/40 p-4">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">B</span>
                <p className="text-sm font-semibold text-foreground">Land bonus</p>
                <Badge variant="secondary" className="ml-auto text-xs">50% of quota</Badge>
              </div>
              <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                Split by hectares. More land = can produce more = earns a larger share of this pool.
              </p>
              <p className="mt-2 font-mono text-sm font-bold text-primary">
                {(targetKg - basePool).toLocaleString()} kg <span className="font-normal text-muted-foreground">÷ {totalHa} ha</span>
              </p>
            </div>
          </div>

          {/* Progress summary */}
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between gap-6">
                <div>
                  <p className="text-xs text-muted-foreground">Contract target</p>
                  <p className="font-display text-xl font-bold text-foreground">{targetKg.toLocaleString()} kg</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Assigned</p>
                  <p className={`font-display text-xl font-bold ${remaining < 0 ? 'text-destructive' : 'text-primary'}`}>
                    {totalAllocated.toLocaleString()} kg
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Remaining</p>
                  <p className={`font-display text-xl font-bold ${
                    remaining === 0 ? 'text-green-600 dark:text-green-400' :
                    remaining < 0 ? 'text-destructive' : 'text-foreground'
                  }`}>
                    {remaining > 0 ? '+' : ''}{remaining.toLocaleString()} kg
                  </p>
                </div>
                <div className="hidden sm:block">
                  <p className="text-xs text-muted-foreground">Members</p>
                  <p className="font-display text-xl font-bold text-foreground">{farmers.length}</p>
                </div>
              </div>
              <div className="mt-4 space-y-1.5">
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      remaining < 0 ? 'bg-destructive' : remaining === 0 ? 'bg-green-500' : 'bg-primary'
                    }`}
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
                <p className="text-right text-xs text-muted-foreground">{progressPct.toFixed(1)}% filled</p>
              </div>
            </CardContent>
          </Card>

          {/* Farmer cards */}
          <div className="space-y-3">
            {farmers.map((farmer) => {
              const maxKg = Math.floor(farmer.hectares * KG_PER_HA);
              const bd = breakdowns[farmer.id] ?? { base: 0, bonus: 0, total: 0 };
              const capPct = maxKg > 0 ? Math.round((bd.total / maxKg) * 100) : 0;
              const landSharePct = totalHa > 0 ? ((farmer.hectares / totalHa) * 100).toFixed(1) : '0';
              const lockedPct = maxKg > 0 ? Math.round((bd.base / maxKg) * 100) : 0;

              const display = focusedId === farmer.id
                ? (inputText[farmer.id] ?? String(bd.total))
                : String(bd.total);

              return (
                <Card key={farmer.id} className="overflow-hidden">
                  <CardContent className="p-0">
                    {/* Top section */}
                    <div className="flex items-start gap-4 p-4 pb-3">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-foreground">{farmer.name}</p>
                        <div className="mt-1 flex flex-wrap items-center gap-1.5">
                          <Badge variant="outline" className="text-xs">{farmer.hectares} ha</Badge>
                          <Badge variant="outline" className="text-xs">{landSharePct}% of land</Badge>
                          <Badge variant="outline" className="text-xs capitalize">{farmer.payoutMethod}</Badge>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {farmer.location} · {farmer.soilType}
                        </p>
                      </div>

                      {/* Kg input */}
                      <div className="shrink-0 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <input
                            type="number"
                            value={display}
                            min={bd.base}
                            max={maxKg}
                            step={1}
                            onChange={(e) => handleTextChange(farmer.id, e.target.value)}
                            onFocus={() => {
                              setFocusedId(farmer.id);
                              setInputText((prev) => ({ ...prev, [farmer.id]: String(bd.total) }));
                            }}
                            onBlur={() => handleTextBlur(farmer.id)}
                            onKeyDown={(e) => e.key === 'Enter' && handleTextBlur(farmer.id)}
                            className="w-24 rounded-lg border border-input bg-background px-2 py-1.5 text-right font-mono text-xl font-bold text-primary tabular-nums focus:outline-none focus:ring-2 focus:ring-primary/50"
                            aria-label={`kg assigned to ${farmer.name}`}
                          />
                          <span className="text-sm text-muted-foreground">kg</span>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">{capPct}% of capacity</p>
                      </div>
                    </div>

                    {/* Breakdown row */}
                    <div className="mx-4 mb-3 flex items-center divide-x divide-border overflow-hidden rounded-lg border border-border text-center text-xs">
                      <div className="flex-1 bg-muted/30 px-3 py-2">
                        <div className="flex items-center justify-center gap-1 text-muted-foreground">
                          <Lock className="h-3 w-3" />
                          <span>Pool A base</span>
                        </div>
                        <p className="mt-0.5 font-mono font-semibold text-foreground">{bd.base.toLocaleString()} kg</p>
                        <p className="text-muted-foreground/70">locked · equal for all</p>
                      </div>
                      <div className="flex-1 px-3 py-2">
                        <p className="text-muted-foreground">Pool B bonus</p>
                        <p className="mt-0.5 font-mono font-semibold text-foreground">+{bd.bonus.toLocaleString()} kg</p>
                        <p className="text-muted-foreground/70">{landSharePct}% land share</p>
                      </div>
                      <div className="flex-1 bg-primary/5 px-3 py-2">
                        <p className="font-medium text-primary">Total</p>
                        <p className="mt-0.5 font-mono font-bold text-primary">{bd.total.toLocaleString()} kg</p>
                        <p className="text-muted-foreground/70">A + B</p>
                      </div>
                    </div>

                    {/* Slider with locked zone indicator */}
                    <div className="px-4 pb-4">
                      <div className="relative">
                        {/* Locked zone underlay */}
                        <div
                          className="absolute inset-y-0 left-0 rounded-l-full bg-muted"
                          style={{ width: `${lockedPct}%`, top: '50%', transform: 'translateY(-50%)', height: '6px', zIndex: 0 }}
                        />
                        <Slider
                          value={[bd.total]}
                          onValueChange={(v) => handleSlider(farmer.id, v)}
                          min={bd.base}
                          max={maxKg}
                          step={1}
                          className="relative z-10"
                        />
                      </div>
                      <div className="mt-1.5 flex justify-between text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Lock className="h-3 w-3" />
                          Min {bd.base.toLocaleString()} kg
                        </span>
                        <span>Max {maxKg.toLocaleString()} kg</span>
                      </div>

                      {/* Capacity bar */}
                      <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className={`h-full rounded-full transition-all duration-200 ${
                            capPct >= 100 ? 'bg-amber-500' : capPct >= 80 ? 'bg-yellow-400' : 'bg-primary/40'
                          }`}
                          style={{ width: `${Math.min(capPct, 100)}%` }}
                        />
                      </div>
                      <p className="mt-1 text-right text-xs text-muted-foreground">
                        {capPct >= 100
                          ? <span className="font-medium text-amber-600 dark:text-amber-400">At max capacity</span>
                          : <span>{100 - capPct}% capacity free</span>}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Single status line — only shown when something needs attention */}
          {remaining !== 0 && (
            <div className={`flex items-center gap-2 rounded-lg border p-3 text-sm ${
              remaining < 0
                ? 'border-destructive/30 bg-destructive/5 text-destructive'
                : 'border-border bg-muted/50 text-muted-foreground'
            }`}>
              {remaining < 0
                ? <AlertTriangle className="h-4 w-4 shrink-0" />
                : <span className="h-4 w-4 shrink-0 text-center font-bold leading-4">!</span>}
              <span>
                {remaining < 0
                  ? <><strong>{Math.abs(remaining).toLocaleString()} kg</strong> over-allocated — reduce values or reset.</>
                  : <><strong>{remaining.toLocaleString()} kg</strong> still unassigned — distribute all quota to confirm.</>}
              </span>
            </div>
          )}

          {/* Confirm button */}
          <Button
            className="w-full gap-2"
            size="lg"
            onClick={handleConfirm}
            disabled={remaining !== 0}
          >
            <Check className="h-4 w-4" />
            Confirm Allocation
            {remaining === 0 && ' — Fully Assigned ✓'}
          </Button>
        </>
      )}
    </div>
  );
}