import { create } from 'zustand';
 
// ── CropStatus — unchanged ────────────────────────────────────────────────────
export type CropStatus =
  | 'pending'
  | 'seeds_planted'
  | 'fertilized'
  | 'growing'
  | 'ready_for_harvest'
  | 'harvested'
  | 'delivered';
 
// ── ContractStatus — unchanged ────────────────────────────────────────────────
export type ContractStatus =
  | 'open'
  | 'matched'
  | 'accepted'
  | 'funded'
  | 'in_progress'
  | 'completed'
  | 'declined';
 
// ── FarmerSmsStatus — unchanged ───────────────────────────────────────────────
export type FarmerSmsStatus = 'pending' | 'notified' | 'confirmed' | 'planted' | 'harvested';
 
// ── new code starts here ──────────────────────────────────────────────────────
// Three new types powering the dual sign-off / escrow-protection system.
//
// MilestoneVerificationStatus tracks each evidence record through its lifecycle:
//   pending_verification → farmer submitted, waiting for buyer/manager sign-off
//   verified             → co-confirmed; progress advances, escrow can release
//   disputed             → evidence rejected by either party; escrow frozen
export type MilestoneVerificationStatus = 'pending_verification' | 'verified' | 'disputed';
 
// MilestoneEvidence is one record per milestone submission.
// The Contract's milestoneEvidence array holds all of these in order.
export interface MilestoneEvidence {
  cropStatus: CropStatus;
  photoFileName: string;       // simulated photo proof
  submittedAt: string;         // ISO timestamp of farmer submission
  verificationStatus: MilestoneVerificationStatus;
  verifiedAt?: string;         // ISO timestamp set by verifyMilestone()
  disputeReason?: string;      // free-text set by disputeMilestone()
}
// ── end ───────────────────────────────────────────────────────────────────────
 
// ── Farmer — unchanged ────────────────────────────────────────────────────────
export interface Farmer {
  id: string;
  name: string;
  hectares: number;
  location: string;
  lat: number;
  lng: number;
  soilType: string;
  smsStatus: FarmerSmsStatus;
  assignedKg: number;
  payoutMethod: 'cash' | 'gcash' | 'maya';
  paid: boolean;
}
 
// ── Cooperative — unchanged ───────────────────────────────────────────────────
export interface Cooperative {
  id: string;
  name: string;
  region: string;
  lat: number;
  lng: number;
  totalHectares: number;
  members: Farmer[];
  soilScore: number;
  weatherScore: number;
}
 
// ── SoloFarmer — unchanged ────────────────────────────────────────────────────
export interface SoloFarmer {
  id: string;
  name: string;
  hectares: number;
  location: string;
  lat: number;
  lng: number;
  soilType: string;
  smsStatus: FarmerSmsStatus;
  assignedKg: number;
  payoutMethod: 'cash' | 'gcash' | 'maya';
  paid: boolean;
}
 
// ── modified code starts here ─────────────────────────────────────────────────
// previous Contract only had:
//   id, crop, volumeKg, targetDate, status, cropStatus, progress,
//   buyerName, matchedCooperative?, escrowAmount, createdAt
//
// Four new fields added to support the verification and escrow-protection flow.
// All default to safe/empty values in mock data and addContract().
export interface Contract {
  id: string;
  crop: string;
  volumeKg: number;
  targetDate: string;
  status: ContractStatus;
  cropStatus: CropStatus;
  progress: number;
  buyerName: string;
  matchedCooperative?: Cooperative;
  escrowAmount: number;
  createdAt: string;
 
  // new code starts here ───────────────────────────────────────────────────────
  // One entry per milestone submitted; grows as the farmer reports progress.
  milestoneEvidence: MilestoneEvidence[];
  // Flips to true when farmer submits "delivered" evidence.
  // Stays true until buyer calls verifyMilestone("delivered").
  // While true, PayoutView's distribute button is disabled.
  pendingBuyerConfirmation: boolean;
  // Flips to true only after buyer explicitly calls verifyMilestone("delivered").
  // This is the single gate that enables PayoutView and DirectPayoutView payouts.
  buyerConfirmedDelivery: boolean;
  // Flips to true via disputeMilestone(). Freezes escrow across all three portals.
  // Reset to false only by admin via resolveDispute().
  disputeFlag: boolean;
  // end ─────────────────────────────────────────────────────────────────────────
}
// ── end ───────────────────────────────────────────────────────────────────────
 
// ── DemandRequest — unchanged ─────────────────────────────────────────────────
export interface DemandRequest {
  crop: string;
  volumeKg: number;
  targetDate: string;
}
 
// ── BroadcastMessage — unchanged ──────────────────────────────────────────────
export interface BroadcastMessage {
  id: string;
  text: string;
  time: string;
}
 
// ── modified code starts here ─────────────────────────────────────────────────
// previous AppState actions:
//   addBroadcastMessage, clearBroadcastMessages, setActiveView, selectContract,
//   addContract, matchContract, acceptContract, declineContract, fundContract,
//   updateCropStatus, updateFarmerSmsStatus, addCoopMember, removeCoopMember,
//   updateCoopMemberCrops
//
// Four new verification actions added at the bottom of the interface.
// updateCropStatus is kept for backward-compat (legacy SMS flow) but should
// not be called from ContractProgress or any new milestone-tracking view.
interface AppState {
  contracts: Contract[];
  cooperatives: Cooperative[];
  soloFarmers: SoloFarmer[];
  activeView: string;
  selectedContractId: string | null;
  broadcastMessages: BroadcastMessage[];
 
  // All unchanged
  addBroadcastMessage: (text: string) => void;
  clearBroadcastMessages: () => void;
  setActiveView: (view: string) => void;
  selectContract: (id: string | null) => void;
  addContract: (demand: DemandRequest) => Contract;
  matchContract: (contractId: string, coopId: string) => void;
  acceptContract: (contractId: string) => void;
  declineContract: (contractId: string) => void;
  fundContract: (contractId: string) => void;
  updateCropStatus: (contractId: string, status: CropStatus) => void;
  updateFarmerSmsStatus: (contractId: string, farmerId: string, status: FarmerSmsStatus) => void;
  addCoopMember: (coopId: string, farmer: Farmer) => void;
  removeCoopMember: (coopId: string, farmerId: string) => void;
  updateCoopMemberCrops: (coopId: string, farmerId: string, crops: string[]) => void;
 
  // new code starts here ───────────────────────────────────────────────────────
  submitMilestoneEvidence: (contractId: string, cropStatus: CropStatus, photoFileName: string) => void;
  verifyMilestone: (contractId: string, cropStatus: CropStatus) => void;
  disputeMilestone: (contractId: string, cropStatus: CropStatus, reason: string) => void;
  resolveDispute: (contractId: string) => void;
  // end ─────────────────────────────────────────────────────────────────────────
}
// ── end ───────────────────────────────────────────────────────────────────────
 
// ── Mock farmers — unchanged ──────────────────────────────────────────────────
const mockFarmers: Farmer[] = [
  { id: 'f1', name: 'Juan dela Cruz',  hectares: 2.5, location: 'Brgy. San Jose',   lat: 14.58, lng: 121.0,  soilType: 'Loam',       smsStatus: 'pending', assignedKg: 0, payoutMethod: 'gcash', paid: false },
  { id: 'f2', name: 'Maria Santos',    hectares: 1.8, location: 'Brgy. Sta. Rosa',  lat: 14.61, lng: 121.02, soilType: 'Clay Loam',  smsStatus: 'pending', assignedKg: 0, payoutMethod: 'maya',  paid: false },
  { id: 'f3', name: 'Pedro Reyes',     hectares: 3.0, location: 'Brgy. Bagumbayan', lat: 14.56, lng: 120.98, soilType: 'Sandy Loam', smsStatus: 'pending', assignedKg: 0, payoutMethod: 'cash',  paid: false },
  { id: 'f4', name: 'Ana Flores',      hectares: 2.2, location: 'Brgy. Maligaya',   lat: 14.59, lng: 121.04, soilType: 'Loam',       smsStatus: 'pending', assignedKg: 0, payoutMethod: 'gcash', paid: false },
  { id: 'f5', name: 'Ricardo Mendoza', hectares: 4.0, location: 'Brgy. Pag-asa',    lat: 14.63, lng: 120.96, soilType: 'Silt Loam',  smsStatus: 'pending', assignedKg: 0, payoutMethod: 'cash',  paid: false },
];
 
// ── Mock cooperatives — unchanged ─────────────────────────────────────────────
const mockCooperatives: Cooperative[] = [
  { id: 'coop1', name: 'Quezon Farmers Cooperative', region: 'Quezon Province',  lat: 14.59, lng: 121.01, totalHectares: 13.5, soilScore: 87, weatherScore: 92, members: mockFarmers.slice(0, 3) },
  { id: 'coop2', name: 'Laguna Harvest Alliance',    region: 'Laguna Province',   lat: 14.27, lng: 121.41, totalHectares: 9.0,  soilScore: 91, weatherScore: 85, members: mockFarmers.slice(2, 5) },
  { id: 'coop3', name: 'Batangas Green Growers',     region: 'Batangas Province', lat: 13.76, lng: 121.06, totalHectares: 18.2, soilScore: 94, weatherScore: 88, members: mockFarmers },
];
 
// ── Mock solo farmers — unchanged ─────────────────────────────────────────────
const mockSoloFarmers: SoloFarmer[] = [
  { id: 'sf1', name: 'Luzviminda Garcia', hectares: 1.5, location: 'Brgy. San Isidro', lat: 14.57, lng: 121.03, soilType: 'Loam',      smsStatus: 'pending', assignedKg: 0, payoutMethod: 'gcash', paid: false },
  { id: 'sf2', name: 'Manuel Santos',     hectares: 2.0, location: 'Brgy. Santa Cruz', lat: 14.60, lng: 121.05, soilType: 'Silt Loam', smsStatus: 'pending', assignedKg: 0, payoutMethod: 'maya',  paid: false },
];
 
// ── modified code starts here ─────────────────────────────────────────────────
// previous mockContracts had no milestoneEvidence, pendingBuyerConfirmation,
// buyerConfirmedDelivery, or disputeFlag on any object.
// Each contract now carries pre-populated milestoneEvidence matching its
// current cropStatus so the UI shows a realistic verified history on first load.
const mockContracts: Contract[] = [
  {
    id: 'c1', crop: 'Tomatoes', volumeKg: 5000, targetDate: '2026-06-15',
    status: 'in_progress', cropStatus: 'growing', progress: 60,
    buyerName: 'Metro Fresh Foods', matchedCooperative: mockCooperatives[0],
    escrowAmount: 150000, createdAt: '2026-01-10',
    // new code starts here ─────────────────────────────────────────────────────
    milestoneEvidence: [
      { cropStatus: 'seeds_planted', photoFileName: 'seeds_c1.jpg',      submittedAt: '2026-01-20T08:00:00Z', verificationStatus: 'verified', verifiedAt: '2026-01-20T14:00:00Z' },
      { cropStatus: 'fertilized',    photoFileName: 'fertilized_c1.jpg', submittedAt: '2026-02-05T09:00:00Z', verificationStatus: 'verified', verifiedAt: '2026-02-05T16:00:00Z' },
      { cropStatus: 'growing',       photoFileName: 'growing_c1.jpg',    submittedAt: '2026-02-20T10:00:00Z', verificationStatus: 'verified', verifiedAt: '2026-02-20T15:00:00Z' },
    ],
    pendingBuyerConfirmation: false,
    buyerConfirmedDelivery: false,
    disputeFlag: false,
    // end ───────────────────────────────────────────────────────────────────────
  },
  {
    id: 'c2', crop: 'Rice (Sinandomeng)', volumeKg: 10000, targetDate: '2026-08-01',
    status: 'funded', cropStatus: 'seeds_planted', progress: 25,
    buyerName: 'Metro Fresh Foods', matchedCooperative: mockCooperatives[2],
    escrowAmount: 450000, createdAt: '2026-02-01',
    // new code starts here ─────────────────────────────────────────────────────
    milestoneEvidence: [
      { cropStatus: 'seeds_planted', photoFileName: 'seeds_c2.jpg', submittedAt: '2026-02-10T07:30:00Z', verificationStatus: 'verified', verifiedAt: '2026-02-10T13:00:00Z' },
    ],
    pendingBuyerConfirmation: false,
    buyerConfirmedDelivery: false,
    disputeFlag: false,
    // end ───────────────────────────────────────────────────────────────────────
  },
  {
    id: 'c3', crop: 'Onions (Red)', volumeKg: 3000, targetDate: '2026-05-20',
    status: 'matched', cropStatus: 'pending', progress: 10,
    buyerName: 'Metro Fresh Foods', matchedCooperative: mockCooperatives[1],
    escrowAmount: 0, createdAt: '2026-03-05',
    // new code starts here ─────────────────────────────────────────────────────
    milestoneEvidence: [],
    pendingBuyerConfirmation: false,
    buyerConfirmedDelivery: false,
    disputeFlag: false,
    // end ───────────────────────────────────────────────────────────────────────
  },
];
// ── end ───────────────────────────────────────────────────────────────────────
 
// ── new code starts here ──────────────────────────────────────────────────────
// VERIFIED_PROGRESS_MAP replaces the inline progressMap that was inside the old
// updateCropStatus implementation. Progress values here are only applied when
// verifyMilestone() is called — never when the farmer merely submits evidence.
const VERIFIED_PROGRESS_MAP: Record<CropStatus, number> = {
  pending:            0,
  seeds_planted:     25,
  fertilized:        40,
  growing:           60,
  ready_for_harvest: 80,
  harvested:         95,
  delivered:        100,
};
// ── end ───────────────────────────────────────────────────────────────────────
 
export const useAppStore = create<AppState>((set, get) => ({
  contracts: mockContracts,
  cooperatives: mockCooperatives,
  soloFarmers: mockSoloFarmers,
  activeView: 'dashboard',
  selectedContractId: null,
  broadcastMessages: [],
 
  // ── Unchanged ─────────────────────────────────────────────────────────────
  addBroadcastMessage: (text) => {
    const msg: BroadcastMessage = {
      id: `bcast-${Date.now()}`,
      text,
      time: new Date().toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' }),
    };
    set((s) => ({ broadcastMessages: [...s.broadcastMessages, msg] }));
  },
  clearBroadcastMessages: () => set({ broadcastMessages: [] }),
  setActiveView:  (view) => set({ activeView: view }),
  selectContract: (id)   => set({ selectedContractId: id }),
 
  // ── modified code starts here ───────────────────────────────────────────────
  // previous addContract did not include the four new verification fields.
  // They are now initialised here so every new contract from DemandView
  // is immediately compatible with the verification flow.
  addContract: (demand) => {
    const newContract: Contract = {
      id: `c${Date.now()}`,
      crop: demand.crop,
      volumeKg: demand.volumeKg,
      targetDate: demand.targetDate,
      status: 'open',
      cropStatus: 'pending',
      progress: 0,
      buyerName: 'Metro Fresh Foods',
      escrowAmount: 0,
      createdAt: new Date().toISOString().split('T')[0],
      // new code starts here ───────────────────────────────────────────────────
      milestoneEvidence: [],
      pendingBuyerConfirmation: false,
      buyerConfirmedDelivery: false,
      disputeFlag: false,
      // end ─────────────────────────────────────────────────────────────────────
    };
    set((s) => ({ contracts: [...s.contracts, newContract] }));
    return newContract;
  },
  // ── end ─────────────────────────────────────────────────────────────────────
 
  // Unchanged
  matchContract: (contractId, coopId) => {
    const coop = get().cooperatives.find((c) => c.id === coopId);
    if (!coop) return;
    set((s) => ({
      contracts: s.contracts.map((c) =>
        c.id === contractId
          ? { ...c, status: 'matched' as ContractStatus, matchedCooperative: coop, progress: 10 }
          : c,
      ),
    }));
  },
 
  acceptContract: (contractId) => {
    set((s) => ({
      contracts: s.contracts.map((c) =>
        c.id === contractId ? { ...c, status: 'accepted' as ContractStatus, progress: 15 } : c,
      ),
    }));
  },
 
  declineContract: (contractId) => {
    set((s) => ({
      contracts: s.contracts.map((c) =>
        c.id === contractId ? { ...c, status: 'declined' as ContractStatus, progress: 0 } : c,
      ),
    }));
  },
 
  fundContract: (contractId) => {
    set((s) => ({
      contracts: s.contracts.map((c) =>
        c.id === contractId
          ? { ...c, status: 'funded' as ContractStatus, escrowAmount: c.volumeKg * 30, progress: Math.max(c.progress, 20) }
          : c,
      ),
    }));
  },
 
  // ── modified code starts here ───────────────────────────────────────────────
  // previous updateCropStatus used an inline progressMap and advanced progress
  // directly on every call, with no verification check.
  // It is now a legacy escape hatch only. The inline map is replaced by
  // VERIFIED_PROGRESS_MAP above. This action should not be called from any
  // view that participates in the verification flow — use submitMilestoneEvidence
  // + verifyMilestone instead. It is still used by SmsHubView for the SMS-only
  // farmer status path which does not have photo evidence.
  updateCropStatus: (contractId, status) => {
    set((s) => ({
      contracts: s.contracts.map((c) =>
        c.id === contractId
          ? {
              ...c,
              cropStatus: status,
              progress: VERIFIED_PROGRESS_MAP[status],
              status: status === 'delivered' ? ('completed' as ContractStatus) : c.status,
            }
          : c,
      ),
    }));
  },
  // ── end ─────────────────────────────────────────────────────────────────────
 
  // Unchanged
  updateFarmerSmsStatus: (contractId, farmerId, status) => {
    set((s) => ({
      contracts: s.contracts.map((c) => {
        if (c.id !== contractId || !c.matchedCooperative) return c;
        return {
          ...c,
          matchedCooperative: {
            ...c.matchedCooperative,
            members: c.matchedCooperative.members.map((f) =>
              f.id === farmerId ? { ...f, smsStatus: status } : f,
            ),
          },
        };
      }),
    }));
  },
 
  addCoopMember: (coopId, farmer) => {
    set((s) => ({
      cooperatives: s.cooperatives.map((coop) =>
        coop.id === coopId
          ? { ...coop, members: [...coop.members, farmer], totalHectares: parseFloat((coop.totalHectares + farmer.hectares).toFixed(2)) }
          : coop,
      ),
    }));
  },
 
  removeCoopMember: (coopId, farmerId) => {
    set((s) => ({
      cooperatives: s.cooperatives.map((coop) => {
        if (coop.id !== coopId) return coop;
        const removed = coop.members.find((f) => f.id === farmerId);
        return {
          ...coop,
          members: coop.members.filter((f) => f.id !== farmerId),
          totalHectares: parseFloat((coop.totalHectares - (removed?.hectares ?? 0)).toFixed(2)),
        };
      }),
    }));
  },
 
  updateCoopMemberCrops: (coopId, farmerId, crops) => {
    set((s) => ({
      cooperatives: s.cooperatives.map((coop) =>
        coop.id !== coopId
          ? coop
          : { ...coop, members: coop.members.map((f) => (f.id === farmerId ? { ...f, crops } as any : f)) },
      ),
    }));
  },
 
  // ── new code starts here ────────────────────────────────────────────────────
  // submitMilestoneEvidence
  // Caller: ContractProgress (solo farmer) and coop milestone submit panels.
  // Behaviour:
  //   - Creates evidence with verificationStatus = "pending_verification"
  //   - Updates cropStatus optimistically (timeline moves, progress does NOT)
  //   - Sets pendingBuyerConfirmation = true when cropStatus === "delivered"
  //   - Replaces any previous evidence for the same cropStatus (resubmission)
  submitMilestoneEvidence: (contractId, cropStatus, photoFileName) => {
    const evidence: MilestoneEvidence = {
      cropStatus,
      photoFileName,
      submittedAt: new Date().toISOString(),
      verificationStatus: 'pending_verification',
    };
    set((s) => ({
      contracts: s.contracts.map((c) => {
        if (c.id !== contractId) return c;
        const existingIdx = c.milestoneEvidence.findIndex((e) => e.cropStatus === cropStatus);
        const updatedEvidence =
          existingIdx >= 0
            ? c.milestoneEvidence.map((e, i) => (i === existingIdx ? evidence : e))
            : [...c.milestoneEvidence, evidence];
        return {
          ...c,
          cropStatus,
          pendingBuyerConfirmation: cropStatus === 'delivered' ? true : c.pendingBuyerConfirmation,
          milestoneEvidence: updatedEvidence,
        };
      }),
    }));
  },
 
  // verifyMilestone
  // Caller: ContractsView (buyer confirms) or manager co-sign.
  // Behaviour:
  //   - Marks evidence as "verified" + stamps verifiedAt
  //   - Advances progress via VERIFIED_PROGRESS_MAP
  //   - For "delivered": sets buyerConfirmedDelivery = true,
  //     pendingBuyerConfirmation = false, status = "completed"
  //     → This is the single unlock that enables payout on all portals.
  verifyMilestone: (contractId, cropStatus) => {
    set((s) => ({
      contracts: s.contracts.map((c) => {
        if (c.id !== contractId) return c;
        const updatedEvidence = c.milestoneEvidence.map((e) =>
          e.cropStatus === cropStatus
            ? { ...e, verificationStatus: 'verified' as MilestoneVerificationStatus, verifiedAt: new Date().toISOString() }
            : e,
        );
        const isDelivery = cropStatus === 'delivered';
        return {
          ...c,
          progress: VERIFIED_PROGRESS_MAP[cropStatus],
          status: isDelivery ? ('completed' as ContractStatus) : c.status,
          buyerConfirmedDelivery: isDelivery ? true : c.buyerConfirmedDelivery,
          pendingBuyerConfirmation: isDelivery ? false : c.pendingBuyerConfirmation,
          milestoneEvidence: updatedEvidence,
        };
      }),
    }));
  },
 
  // disputeMilestone
  // Caller: ContractProgress (farmer disputes buyer review) or ContractsView (buyer disputes delivery).
  // Behaviour:
  //   - Marks evidence as "disputed" with the reason string
  //   - Sets disputeFlag = true → freezes escrow on PayoutView, DirectPayoutView, PaymentsView
  disputeMilestone: (contractId, cropStatus, reason) => {
    set((s) => ({
      contracts: s.contracts.map((c) => {
        if (c.id !== contractId) return c;
        const updatedEvidence = c.milestoneEvidence.map((e) =>
          e.cropStatus === cropStatus
            ? { ...e, verificationStatus: 'disputed' as MilestoneVerificationStatus, disputeReason: reason }
            : e,
        );
        return { ...c, disputeFlag: true, milestoneEvidence: updatedEvidence };
      }),
    }));
  },
 
  // resolveDispute
  // Caller: admin-only demo button in ContractProgress DisputeFrozenBanner.
  // Behaviour:
  //   - Sets disputeFlag = false (unfreezes escrow everywhere)
  //   - Resets all "disputed" evidence back to "pending_verification"
  //     so the buyer can review it again cleanly
  resolveDispute: (contractId) => {
    set((s) => ({
      contracts: s.contracts.map((c) => {
        if (c.id !== contractId) return c;
        const updatedEvidence = c.milestoneEvidence.map((e) =>
          e.verificationStatus === 'disputed'
            ? { ...e, verificationStatus: 'pending_verification' as MilestoneVerificationStatus, disputeReason: undefined }
            : e,
        );
        return { ...c, disputeFlag: false, milestoneEvidence: updatedEvidence };
      }),
    }));
  },
  // ── end ─────────────────────────────────────────────────────────────────────
}));
 