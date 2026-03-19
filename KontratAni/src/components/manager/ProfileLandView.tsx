import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Pencil, Plus, Trash2, Leaf, AlertCircle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore, type Farmer } from '@/store/useAppStore';

// ── Local display shape ───────────────────────────────────────────────────────
export interface FarmerMember {
  id: string;        // matches Farmer.id in the store
  name: string;
  ha: number;
  barangay: string;
  crops: string[];   // not in Farmer — kept local
  phone: string;     // not in Farmer — kept local
  paymentMode: 'ewallet' | 'cash';
}

interface ProfileLandViewProps {
  isSolo: boolean;
  setIsSolo: (val: boolean) => void;
  coopId: string;   // which cooperative this manager belongs to
}

interface ProfileData {
  coopName: string;
  soloName: string;
  municipality: string;
  province: string;
  plots: number;
  soilType: string;
  elevation: string;
  irrigation: string;
  certifications: string[];
  primaryCrops: string[];
}

const INITIAL_PROFILE: ProfileData = {
  coopName:      'Malinao Farmers Cooperative',
  soloName:      'Juan dela Cruz',
  municipality:  'Mabalacat City',
  province:      'Pampanga',
  plots:         3,
  soilType:      'Loam',
  elevation:     '98',
  irrigation:    'Canal',
  certifications: ['Organiko PHL', 'GAP Certified'],
  primaryCrops:  ['Tomatoes', 'Eggplant', 'Ampalaya'],
};

// ── Phone validation helpers ──────────────────────────────────────────────────
const isValidPHPhone = (v: string) => /^09\d{9}$/.test(v);
const sanitizePhone  = (raw: string) => raw.replace(/[^\d]/g, '').slice(0, 11);

const phoneError = (v: string): string | null => {
  if (!v) return null;
  if (v.length > 0 && v[0] !== '0')          return 'Must start with 0';
  if (v.length > 1 && v[1] !== '9')          return 'Must start with 09';
  if (v.length === 11 && !isValidPHPhone(v)) return 'Invalid PH mobile number';
  return null;
};

// ── Map store Farmer → FarmerMember ──────────────────────────────────────────
function toFarmerMember(f: Farmer): FarmerMember {
  return {
    id:          f.id,
    name:        f.name,
    ha:          f.hectares,
    barangay:    f.location.replace(/^Brgy\.\s*/i, ''),
    crops:       (f as any).crops ?? [],
    phone:       (f as any).phone ?? '',
    paymentMode: f.payoutMethod === 'cash' ? 'cash' : 'ewallet',
  };
}

// ── Editable tag list ─────────────────────────────────────────────────────────
function TagEditor({
  tags, onChange, color = 'gray', placeholder = 'Add...',
}: {
  tags: string[];
  onChange: (tags: string[]) => void;
  color?: 'teal' | 'green' | 'gray';
  placeholder?: string;
}) {
  const [input, setInput]   = useState('');
  const [adding, setAdding] = useState(false);
  const inputRef            = useRef<HTMLInputElement>(null);

  const styles = {
    teal:  { pill: 'border-[#9FE1CB] bg-[#E1F5EE] text-[#085041]', xBtn: 'hover:text-[#085041]' },
    green: { pill: 'border-[#C0DD97] bg-[#EAF3DE] text-[#27500A]', xBtn: 'hover:text-[#27500A]' },
    gray:  { pill: 'border-border bg-accent text-muted-foreground', xBtn: 'hover:text-foreground' },
  };
  const s = styles[color];

  const startAdding = () => {
    setAdding(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const confirm = () => {
    const v = input.trim();
    if (v && !tags.includes(v)) onChange([...tags, v]);
    setInput('');
    setAdding(false);
  };

  const cancel = () => { setInput(''); setAdding(false); };

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {tags.map((tag) => (
        <span key={tag} className={`flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium ${s.pill}`}>
          {tag}
          <button onClick={() => onChange(tags.filter((t) => t !== tag))} className={`ml-0.5 text-current opacity-60 ${s.xBtn}`}>
            <X className="h-2.5 w-2.5" />
          </button>
        </span>
      ))}

      {adding ? (
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter')  confirm();
            if (e.key === 'Escape') cancel();
          }}
          onBlur={confirm}
          placeholder="Type & press Enter"
          className="h-6 w-28 rounded-md border border-[#2D6A4F] bg-transparent px-2 text-[11px] text-foreground placeholder:text-muted-foreground/40 focus:outline-none"
        />
      ) : (
        <button
          onClick={startAdding}
          className="flex h-5 w-5 items-center justify-center rounded-full bg-accent text-muted-foreground hover:bg-[#EAF3DE] hover:text-[#2D6A4F]"
        >
          <Plus className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export function ProfileLandView({ isSolo, setIsSolo, coopId }: ProfileLandViewProps) {
  // ── Store ──────────────────────────────────────────────────────────────────
  const cooperative       = useAppStore((s) => s.cooperatives.find((c) => c.id === coopId));
  const addCoopMember     = useAppStore((s) => s.addCoopMember);
  const removeCoopMember  = useAppStore((s) => s.removeCoopMember);
  const updateCoopMemberCrops = useAppStore((s) => s.updateCoopMemberCrops);

  // Derive FarmerMember list from store; keep local extra fields (crops, phone) in a side map
  const storeMembers: FarmerMember[] = (cooperative?.members ?? []).map(toFarmerMember);

  // Local extra fields not in the store (crops tags, phone) — keyed by farmer id
  const [localExtras, setLocalExtras] = useState<Record<string, { crops: string[]; phone: string }>>(() =>
    Object.fromEntries(storeMembers.map((f) => [f.id, { crops: f.crops, phone: f.phone }]))
  );

  // Merge store + local extras for display
  const farmers: FarmerMember[] = storeMembers.map((f) => ({
    ...f,
    crops: localExtras[f.id]?.crops ?? [],
    phone: localExtras[f.id]?.phone ?? '',
  }));

  // Derived totals straight from the store
  const totalCoopHa = cooperative?.totalHectares ?? 0;

  // ── Local UI state ─────────────────────────────────────────────────────────
  const [profile, setProfile]           = useState<ProfileData>(INITIAL_PROFILE);
  const [profileEdit, setProfileEdit]   = useState(false);
  const [landEdit, setLandEdit]         = useState(false);
  const [addingFarmer, setAddingFarmer] = useState(false);
  const [phoneErr, setPhoneErr]         = useState<string | null>(null);
  const [newFarmer, setNewFarmer]       = useState({
    name: '', ha: '', barangay: '', phone: '', paymentMode: 'cash' as 'ewallet' | 'cash',
  });

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handlePhoneInput = (raw: string) => {
    const clean = sanitizePhone(raw);
    setNewFarmer((p) => ({ ...p, phone: clean }));
    setPhoneErr(clean.length > 0 ? phoneError(clean) : null);
  };

  const addFarmer = () => {
    if (!newFarmer.name || !newFarmer.ha) return;
    if (newFarmer.phone && !isValidPHPhone(newFarmer.phone)) {
      setPhoneErr('Enter a valid 11-digit PH number (09XXXXXXXXX)');
      return;
    }

    const newId = `f${Date.now()}`;
    const storeFarmer: Farmer = {
      id:           newId,
      name:         newFarmer.name,
      hectares:     +newFarmer.ha,
      location:     newFarmer.barangay ? `Brgy. ${newFarmer.barangay}` : '',
      lat:          0,
      lng:          0,
      soilType:     '',
      smsStatus:    'pending',
      assignedKg:   0,
      payoutMethod: newFarmer.paymentMode === 'ewallet' ? 'gcash' : 'cash',
      paid:         false,
    };

    addCoopMember(coopId, storeFarmer);

    // Store local extras
    setLocalExtras((prev) => ({
      ...prev,
      [newId]: { crops: [], phone: newFarmer.phone },
    }));

    setNewFarmer({ name: '', ha: '', barangay: '', phone: '', paymentMode: 'cash' });
    setPhoneErr(null);
    setAddingFarmer(false);
  };

  const removeFarmer = (id: string) => {
    removeCoopMember(coopId, id);
    setLocalExtras((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const updateFarmerCrops = (id: string, crops: string[]) => {
    setLocalExtras((prev) => ({ ...prev, [id]: { ...prev[id], crops } }));
    updateCoopMemberCrops(coopId, id, crops);
  };

  // ── Field component ────────────────────────────────────────────────────────
  const Field = ({ label, value, onChange, type = 'text', active }: {
    label: string; value: string | number; onChange: (v: string) => void; type?: string; active: boolean;
  }) => (
    <div className="mb-3.5">
      <p className="mb-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
      {active
        ? <input type={type} value={value} onChange={(e) => onChange(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:border-[#2D6A4F] focus:outline-none" />
        : <p className="text-sm font-medium text-foreground">{value}</p>
      }
    </div>
  );

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      {/* Account type toggle */}
      <Card>
        <CardContent className="flex items-center justify-between gap-4 p-4">
          <div>
            <p className="text-sm font-medium text-foreground">Account Type</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {isSolo
                ? 'Solo Farmer — you are the sole fulfiller of all contracts.'
                : 'Cooperative — you manage multiple member farmers.'}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <Label className="text-xs text-muted-foreground">Cooperative</Label>
            <Switch checked={isSolo} onCheckedChange={setIsSolo} />
            <Label className="text-xs text-muted-foreground">Solo Farmer</Label>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-4">
        {/* ── Profile card ── */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3 pt-4">
            <CardTitle className="text-sm">
              {isSolo ? 'Farmer Profile' : 'Cooperative Profile'}
            </CardTitle>
            <button
              onClick={() => setProfileEdit(!profileEdit)}
              className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-accent"
            >
              <Pencil className="h-3 w-3" />
              {profileEdit ? 'Save' : 'Edit'}
            </button>
          </CardHeader>
          <CardContent>
            <Field
              label={isSolo ? 'Your Full Name' : 'Cooperative Name'}
              value={isSolo ? profile.soloName : (cooperative?.name ?? profile.coopName)}
              onChange={(v) =>
                setProfile((p) => isSolo ? { ...p, soloName: v } : { ...p, coopName: v })
              }
              active={profileEdit}
            />
            <Field
              label="Municipality / City"
              value={profile.municipality}
              onChange={(v) => setProfile((p) => ({ ...p, municipality: v }))}
              active={profileEdit}
            />
            <Field
              label="Province"
              value={profile.province}
              onChange={(v) => setProfile((p) => ({ ...p, province: v }))}
              active={profileEdit}
            />

            {/* Certifications */}
            <div className="mb-3.5">
              <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                Certifications
              </p>
              {profileEdit ? (
                <TagEditor
                  tags={profile.certifications}
                  onChange={(tags) => setProfile((p) => ({ ...p, certifications: tags }))}
                  color="teal"
                  placeholder="Add cert..."
                />
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {profile.certifications.length > 0
                    ? profile.certifications.map((c) => (
                        <Badge key={c} variant="outline" className="border-[#9FE1CB] bg-[#E1F5EE] text-[10px] text-[#085041]">
                          {c}
                        </Badge>
                      ))
                    : <span className="text-xs text-muted-foreground">None</span>
                  }
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* ── Land card ── */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3 pt-4">
            <CardTitle className="text-sm">Land Registry</CardTitle>
            <button
              onClick={() => setLandEdit(!landEdit)}
              className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-accent"
            >
              <Pencil className="h-3 w-3" />
              {landEdit ? 'Save' : 'Edit'}
            </button>
          </CardHeader>
          <CardContent>
            <div className="mb-4 grid grid-cols-2 gap-2">
              {/* Total Hectares */}
              <div className="rounded-lg bg-accent p-3">
                <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  Total Hectares
                </p>
                {landEdit && isSolo ? (
                  <input
                    type="number" min="0" step="0.1"
                    value={profile.plots}
                    onChange={(e) => setProfile((p) => ({ ...p, plots: +e.target.value }))}
                    className="mt-1 w-full rounded-md border border-border bg-background px-2 py-1 text-lg font-semibold text-foreground focus:border-[#2D6A4F] focus:outline-none"
                  />
                ) : landEdit && !isSolo ? (
                  <div className="mt-1">
                    <p className="text-xl font-semibold text-foreground">{totalCoopHa.toFixed(1)} ha</p>
                    <p className="mt-0.5 text-[10px] text-muted-foreground">Auto-summed from members</p>
                  </div>
                ) : (
                  <p className="mt-1 text-xl font-semibold text-foreground">
                    {isSolo ? `${profile.plots} ha` : `${totalCoopHa.toFixed(1)} ha`}
                  </p>
                )}
              </div>

              {/* Plots (solo) / Farmers (coop) */}
              <div className="rounded-lg bg-accent p-3">
                <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  {isSolo ? 'Plots' : 'Farmers'}
                </p>
                {landEdit && isSolo ? (
                  <input
                    type="number" min="0" step="1"
                    value={profile.plots}
                    onChange={(e) => setProfile((p) => ({ ...p, plots: +e.target.value }))}
                    className="mt-1 w-full rounded-md border border-border bg-background px-2 py-1 text-lg font-semibold text-foreground focus:border-[#2D6A4F] focus:outline-none"
                  />
                ) : (
                  <p className="mt-1 text-xl font-semibold text-foreground">
                    {isSolo ? `${profile.plots} plots` : `${farmers.length} farmers`}
                  </p>
                )}
              </div>
            </div>

            <Field
              label="Soil Type"
              value={profile.soilType}
              onChange={(v) => setProfile((p) => ({ ...p, soilType: v }))}
              active={landEdit}
            />
            <Field
              label="Elevation (MASL)"
              value={profile.elevation}
              onChange={(v) => setProfile((p) => ({ ...p, elevation: v }))}
              active={landEdit}
              type="number"
            />
            <Field
              label="Irrigation Source"
              value={profile.irrigation}
              onChange={(v) => setProfile((p) => ({ ...p, irrigation: v }))}
              active={landEdit}
            />

            {/* Primary Crops */}
            <div>
              <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                Primary Crops
              </p>
              {landEdit ? (
                <TagEditor
                  tags={profile.primaryCrops}
                  onChange={(tags) => setProfile((p) => ({ ...p, primaryCrops: tags }))}
                  color="green"
                  placeholder="Add crop..."
                />
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {profile.primaryCrops.length > 0
                    ? profile.primaryCrops.map((c) => (
                        <Badge key={c} variant="outline" className="border-[#C0DD97] bg-[#EAF3DE] text-[10px] text-[#27500A]">
                          {c}
                        </Badge>
                      ))
                    : <span className="text-xs text-muted-foreground">None</span>
                  }
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Member farmers (Cooperative mode) ── */}
      <AnimatePresence>
        {!isSolo && (
          <motion.div
            key="members"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-3 pt-4">
                <CardTitle className="text-sm">Member Farmers</CardTitle>
                <button
                  onClick={() => { setAddingFarmer(true); setPhoneErr(null); }}
                  className="flex items-center gap-1.5 rounded-md border border-[#C0DD97] bg-[#EAF3DE] px-2.5 py-1 text-xs font-medium text-[#2D6A4F]"
                >
                  <Plus className="h-3 w-3" /> Add Farmer
                </button>
              </CardHeader>
              <CardContent>
                {/* Add farmer form */}
                <AnimatePresence>
                  {addingFarmer && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mb-4 overflow-hidden"
                    >
                      <div className="rounded-lg border border-dashed border-border p-3">
                        {/* Row 1: text fields */}
                        <div className="mb-2 grid grid-cols-[2fr_1fr_1fr_1fr] gap-2">
                          <input
                            placeholder="Full name *"
                            value={newFarmer.name}
                            onChange={(e) => setNewFarmer((p) => ({ ...p, name: e.target.value }))}
                            className="rounded-md border border-border bg-background px-2.5 py-1.5 text-xs text-foreground focus:border-[#2D6A4F] focus:outline-none"
                          />
                          <input
                            placeholder="Hectares *"
                            type="number" min="0" step="0.1"
                            value={newFarmer.ha}
                            onChange={(e) => setNewFarmer((p) => ({ ...p, ha: e.target.value }))}
                            className="rounded-md border border-border bg-background px-2.5 py-1.5 text-xs text-foreground focus:border-[#2D6A4F] focus:outline-none"
                          />
                          <input
                            placeholder="Barangay"
                            value={newFarmer.barangay}
                            onChange={(e) => setNewFarmer((p) => ({ ...p, barangay: e.target.value }))}
                            className="rounded-md border border-border bg-background px-2.5 py-1.5 text-xs text-foreground focus:border-[#2D6A4F] focus:outline-none"
                          />
                          <select
                            value={newFarmer.paymentMode}
                            onChange={(e) =>
                              setNewFarmer((p) => ({ ...p, paymentMode: e.target.value as 'ewallet' | 'cash' }))
                            }
                            className="rounded-md border border-border bg-background px-2 py-1.5 text-xs text-foreground focus:border-[#2D6A4F] focus:outline-none"
                          >
                            <option value="cash">Cash</option>
                            <option value="ewallet">E-wallet</option>
                          </select>
                        </div>

                        {/* Row 2: phone with live validation */}
                        <div className="mb-3">
                          <div className="relative">
                            <input
                              placeholder="Phone number — 09XXXXXXXXX"
                              value={newFarmer.phone}
                              inputMode="numeric"
                              maxLength={11}
                              onChange={(e) => handlePhoneInput(e.target.value)}
                              className={`w-full rounded-md border bg-background px-2.5 py-1.5 pr-14 text-xs text-foreground focus:outline-none ${
                                phoneErr
                                  ? 'border-red-300 focus:border-red-400'
                                  : newFarmer.phone.length === 11 && !phoneErr
                                  ? 'border-[#9FE1CB] focus:border-[#2D6A4F]'
                                  : 'border-border focus:border-[#2D6A4F]'
                              }`}
                            />
                            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground/40">
                              {newFarmer.phone.length}/11
                            </span>
                          </div>
                          {phoneErr
                            ? <p className="mt-1 text-[10px] text-red-500">{phoneErr}</p>
                            : newFarmer.phone.length === 11
                            ? <p className="mt-1 text-[10px] font-medium text-[#0F6E56]">✓ Valid PH mobile number</p>
                            : <p className="mt-0.5 text-[10px] text-muted-foreground/50">
                                Digits only · must start with 09 · 11 digits total
                              </p>
                          }
                        </div>

                        <div className="flex gap-1.5">
                          <button
                            onClick={addFarmer}
                            className="rounded-md bg-[#2D6A4F] px-3 py-1.5 text-xs font-medium text-white"
                          >
                            Add Farmer
                          </button>
                          <button
                            onClick={() => { setAddingFarmer(false); setPhoneErr(null); }}
                            className="rounded-md border border-border bg-accent px-2.5 py-1.5 text-xs text-muted-foreground"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Farmers table */}
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/60">
                      {['Farmer', 'Phone', 'Payment', 'Barangay', 'Area', 'Crops', ''].map((h) => (
                        <th key={h} className="pb-2 text-left text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {farmers.map((f, i) => (
                      <motion.tr
                        key={f.id}
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.04 }}
                        className="border-b border-border/40 last:border-0"
                      >
                        {/* Name */}
                        <td className="py-2.5">
                          <div className="flex items-center gap-2">
                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#EAF3DE] text-[9px] font-bold text-[#27500A]">
                              {f.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                            </div>
                            <span className="font-medium text-foreground">{f.name}</span>
                          </div>
                        </td>
                        {/* Phone */}
                        <td className="py-2.5 text-xs text-muted-foreground">
                          {f.phone
                            ? f.phone.replace(/^(\d{4})(\d{3})(\d{4})$/, '$1-$2-$3')
                            : '—'}
                        </td>
                        {/* Payment */}
                        <td className="py-2.5">
                          <span className={
                            f.paymentMode === 'ewallet'
                              ? 'rounded-full border border-[#9FE1CB] bg-[#E1F5EE] px-2 py-0.5 text-[10px] font-medium text-[#085041]'
                              : 'rounded-full border border-[#D3D1C7] bg-[#F1EFE8] px-2 py-0.5 text-[10px] font-medium text-[#444441]'
                          }>
                            {f.paymentMode === 'ewallet' ? 'E-wallet' : 'Cash'}
                          </span>
                        </td>
                        {/* Barangay */}
                        <td className="py-2.5 text-xs text-muted-foreground">{f.barangay}</td>
                        {/* Area */}
                        <td className="py-2.5 font-medium">{f.ha} ha</td>
                        {/* Crops — inline tag editor */}
                        <td className="py-2.5">
                          <TagEditor
                            tags={f.crops}
                            onChange={(tags) => updateFarmerCrops(f.id, tags)}
                            color="gray"
                            placeholder="+ crop"
                          />
                        </td>
                        {/* Delete */}
                        <td className="py-2.5">
                          <button
                            onClick={() => removeFarmer(f.id)}
                            className="text-muted-foreground/50 hover:text-destructive"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>

                <div className="mt-3 flex items-center gap-2 rounded-lg border border-[#C0DD97] bg-[#EAF3DE] px-3 py-2">
                  <Leaf className="h-3.5 w-3.5 shrink-0 text-[#2D6A4F]" />
                  <p className="text-xs text-[#27500A]">
                    Combined area:{' '}
                    <span className="font-semibold">{totalCoopHa.toFixed(1)} ha</span>{' '}
                    across {farmers.length} member farmers
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Solo notice */}
      <AnimatePresence>
        {isSolo && (
          <motion.div
            key="solo-notice"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="flex items-start gap-3 rounded-xl border border-[#9FE1CB] bg-[#E1F5EE] p-4"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#0F6E56]" />
            <p className="text-sm leading-relaxed text-[#085041]">
              <span className="font-semibold">Solo Farmer mode active.</span> The member farmers
              database is bypassed. You are automatically set as the sole fulfiller for all
              accepted contracts.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}