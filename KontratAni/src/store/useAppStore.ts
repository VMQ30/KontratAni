// useAppStore.ts

import { create } from "zustand";

export type CropStatus =
  | "pending"
  | "seeds_planted"
  | "fertilized"
  | "growing"
  | "ready_for_harvest"
  | "harvested"
  | "delivered";

export type ContractStatus =
  | "open"
  | "matched"
  | "accepted"
  | "funded"
  | "in_progress"
  | "completed"
  | "declined";

export type FarmerSmsStatus =
  | "pending"
  | "notified"
  | "confirmed"
  | "planted"
  | "declined"
  | "harvested";

export type MilestoneVerificationStatus =
  | "pending_verification"
  | "verified"
  | "disputed";

export interface MilestoneEvidence {
  cropStatus: CropStatus;
  photoFileName: string;
  submittedAt: string;
  verificationStatus: MilestoneVerificationStatus;
  verifiedAt?: string;
  disputeReason?: string;
}

// ── Types from useStore ───────────────────────────────────────────────────────
export type Role = "buyer" | "coop_manager" | "solo_farmer" | "sub_farmer";
export type EscrowStatus = "unfunded" | "locked" | "released";
export type PlotStatus =
  | "idle"
  | "assigned"
  | "planted"
  | "harvested"
  | "declined";

export interface User {
  id: string;
  name: string;
  role: Role;
  walletBalance: number;
  payoutMethod: "Cash" | "GCash" | "Maya";
  smsStatus?: "pending" | "notified" | "planted" | "declined";
}

export interface TimelineEvent {
  timestamp: string;
  event: string;
}

export interface FarmPlot {
  id: string;
  ownerId: string;
  assignedFarmerId: string | null;
  coordinates: [number, number];
  status: PlotStatus;
  currentContractId: string | null;
}

// ── Types from useAppStore ────────────────────────────────────────────────────
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
  payoutMethod: "cash" | "gcash" | "maya";
  paid: boolean;
}

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
  payoutMethod: "cash" | "gcash" | "maya";
  paid: boolean;
}

export interface Contract {
  // useAppStore fields
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
  milestoneEvidence: MilestoneEvidence[];
  pendingBuyerConfirmation: boolean;
  buyerConfirmedDelivery: boolean;
  disputeFlag: boolean;
}

export interface DemandRequest {
  crop: string;
  volumeKg: number;
  targetDate: string;
}

export interface BroadcastMessage {
  id: string;
  text: string;
  time: string;
}

// ── Combined state ────────────────────────────────────────────────────────────
interface AppState {
  // ── useAppStore state ──────────────────────────────────────────────────────
  contracts: Contract[];
  cooperatives: Cooperative[];
  soloFarmers: SoloFarmer[];
  activeView: string;
  selectedContractId: string | null;
  confirmedAllocations: string[];
  users: User[]; // For syncing Farmer smsStatus with useStore users
  farmPlots: FarmPlot[]; // For syncing Farmer smsStatus with useStore farmPlots
  broadcastMessages: BroadcastMessage[];

  confirmAllocation: (contractId: string) => void;
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
  updateFarmerSmsStatus: (
    contractId: string,
    farmerId: string,
    status: FarmerSmsStatus,
  ) => void;
  addCoopMember: (coopId: string, farmer: Farmer) => void;
  removeCoopMember: (coopId: string, farmerId: string) => void;
  updateCoopMemberCrops: (
    coopId: string,
    farmerId: string,
    crops: string[],
  ) => void;
  submitMilestoneEvidence: (
    contractId: string,
    cropStatus: CropStatus,
    photoFileName: string,
  ) => void;
  verifyMilestone: (contractId: string, cropStatus: CropStatus) => void;
  disputeMilestone: (
    contractId: string,
    cropStatus: CropStatus,
    reason: string,
  ) => void;
  resolveDispute: (contractId: string) => void;
  resetContracts: () => void;
  updateContract: (contractId: string, partial: Partial<Contract>) => void;
}

// ── Mock farmers ──────────────────────────────────────────────────────────────
const mockFarmers: Farmer[] = [
  {
    id: "f1",
    name: "Juan dela Cruz",
    hectares: 2.5,
    location: "Brgy. San Jose",
    lat: 14.58,
    lng: 121.0,
    soilType: "Loam",
    smsStatus: "confirmed",
    assignedKg: 0,
    payoutMethod: "gcash",
    paid: false,
  },
  {
    id: "f2",
    name: "Maria Santos",
    hectares: 1.8,
    location: "Brgy. Sta. Rosa",
    lat: 14.61,
    lng: 121.02,
    soilType: "Clay Loam",
    smsStatus: "pending",
    assignedKg: 0,
    payoutMethod: "maya",
    paid: false,
  },
  {
    id: "f3",
    name: "Pedro Reyes",
    hectares: 3.0,
    location: "Brgy. Bagumbayan",
    lat: 14.56,
    lng: 120.98,
    soilType: "Sandy Loam",
    smsStatus: "declined",
    assignedKg: 0,
    payoutMethod: "cash",
    paid: false,
  },
  {
    id: "f4",
    name: "Ana Flores",
    hectares: 2.2,
    location: "Brgy. Maligaya",
    lat: 14.59,
    lng: 121.04,
    soilType: "Loam",
    smsStatus: "confirmed",
    assignedKg: 0,
    payoutMethod: "gcash",
    paid: false,
  },
  {
    id: "f5",
    name: "Ricardo Mendoza",
    hectares: 4.0,
    location: "Brgy. Pag-asa",
    lat: 14.63,
    lng: 120.96,
    soilType: "Silt Loam",
    smsStatus: "confirmed",
    assignedKg: 0,
    payoutMethod: "cash",
    paid: false,
  },
];

// ── Mock cooperatives ─────────────────────────────────────────────────────────
const mockCooperatives: Cooperative[] = [
  {
    id: "coop1",
    name: "Quezon Farmers Cooperative",
    region: "Quezon Province",
    lat: 14.59,
    lng: 121.01,
    totalHectares: 13.5,
    soilScore: 87,
    weatherScore: 92,
    members: mockFarmers.slice(0, 3),
  },
  {
    id: "coop2",
    name: "Laguna Harvest Alliance",
    region: "Laguna Province",
    lat: 14.27,
    lng: 121.41,
    totalHectares: 9.0,
    soilScore: 91,
    weatherScore: 85,
    members: mockFarmers.slice(2, 5),
  },
  {
    id: "coop3",
    name: "Batangas Green Growers",
    region: "Batangas Province",
    lat: 13.76,
    lng: 121.06,
    totalHectares: 18.2,
    soilScore: 94,
    weatherScore: 88,
    members: mockFarmers,
  },
];

// ── Mock solo farmers ─────────────────────────────────────────────────────────
const mockSoloFarmers: SoloFarmer[] = [
  {
    id: "sf1",
    name: "Luzviminda Garcia",
    hectares: 13.5,
    location: "Brgy. San Isidro",
    lat: 14.57,
    lng: 121.03,
    soilType: "Loam",
    smsStatus: "pending",
    assignedKg: 0,
    payoutMethod: "gcash",
    paid: false,
  },
  {
    id: "sf2",
    name: "Manuel Santos",
    hectares: 2.0,
    location: "Brgy. Santa Cruz",
    lat: 14.6,
    lng: 121.05,
    soilType: "Silt Loam",
    smsStatus: "pending",
    assignedKg: 0,
    payoutMethod: "maya",
    paid: false,
  },
];

const mockContracts: Contract[] = [
  {
    id: "c1",
    crop: "Kamatis (Tomatoes)",
    volumeKg: 5000,
    targetDate: "2026-09-15",
    status: "accepted",
    cropStatus: "pending",
    progress: 0,
    buyerName: "Metro Fresh Foods",
    matchedCooperative: mockCooperatives[0],
    escrowAmount: 0,
    createdAt: "2026-03-01",
    milestoneEvidence: [],
    pendingBuyerConfirmation: false,
    buyerConfirmedDelivery: false,
    disputeFlag: false,
  },
  {
    id: "c2",
    crop: "Sibuyas (Onions)",
    volumeKg: 3000,
    targetDate: "2026-08-20",
    status: "in_progress",
    cropStatus: "ready_for_harvest", 
    progress: 60, 
    buyerName: "Metro Fresh Foods",
    matchedCooperative: mockCooperatives[1],
    escrowAmount: 90000,
    createdAt: "2026-02-10",
    milestoneEvidence: [
      {
        cropStatus: "seeds_planted",
        photoFileName: "seeds_c2.jpg",
        submittedAt: "2026-02-20T08:00:00Z",
        verificationStatus: "verified",
        verifiedAt: "2026-02-20T14:00:00Z",
      },
      {
        cropStatus: "fertilized",
        photoFileName: "fertilized_c2.jpg",
        submittedAt: "2026-03-05T09:00:00Z",
        verificationStatus: "verified",
        verifiedAt: "2026-03-05T16:00:00Z",
      },
      {
        cropStatus: "growing",
        photoFileName: "", 
        submittedAt: "2026-03-18T10:00:00Z",
        verificationStatus: "verified",
        verifiedAt: "2026-03-18T15:00:00Z",
      },
    ],
    pendingBuyerConfirmation: false,
    buyerConfirmedDelivery: false,
    disputeFlag: false,
  },
  {
    id: "c4",
    crop: "Pechay (Bok Choy)",
    volumeKg: 800,
    targetDate: "2026-06-01",
    status: "in_progress",
    cropStatus: "delivered",
    progress: 95,
    buyerName: "Luzviminda Garcia (Solo Farmer)",
    matchedCooperative: undefined,
    escrowAmount: 24000,
    createdAt: "2026-01-05",
    milestoneEvidence: [
      {
        cropStatus: "seeds_planted",
        photoFileName: "",
        submittedAt: "2026-01-15T08:00:00Z",
        verificationStatus: "verified",
        verifiedAt: "2026-01-15T12:00:00Z",
      },
      {
        cropStatus: "fertilized",
        photoFileName: "",
        submittedAt: "2026-01-28T09:00:00Z",
        verificationStatus: "verified",
        verifiedAt: "2026-01-28T14:00:00Z",
      },
      {
        cropStatus: "growing",
        photoFileName: "",
        submittedAt: "2026-02-10T10:00:00Z",
        verificationStatus: "verified",
        verifiedAt: "2026-02-10T16:00:00Z",
      },
      {
        cropStatus: "ready_for_harvest",
        photoFileName: "",
        submittedAt: "2026-02-22T07:00:00Z",
        verificationStatus: "verified",
        verifiedAt: "2026-02-22T11:00:00Z",
      },
      {
        cropStatus: "harvested",
        photoFileName: "",
        submittedAt: "2026-03-05T08:00:00Z",
        verificationStatus: "verified",
        verifiedAt: "2026-03-05T13:00:00Z",
      },
      {
        cropStatus: "delivered",
        photoFileName: "", // Farmer submitted without photo evidence
        submittedAt: "2026-03-19T06:00:00Z",
        verificationStatus: "pending_verification",
      },
    ],
    pendingBuyerConfirmation: true,
    buyerConfirmedDelivery: false,
    disputeFlag: false,
  },
  {
    id: "c5",
    crop: "Ampalaya (Bitter Gourd)",
    volumeKg: 1500,
    targetDate: "2026-06-10",
    status: "in_progress",
    cropStatus: "delivered",
    progress: 80,
    buyerName: "LGU Feeding Program",
    matchedCooperative: mockCooperatives[1],
    escrowAmount: 45000,
    createdAt: "2026-01-20",
    milestoneEvidence: [
      {
        cropStatus: "seeds_planted",
        photoFileName: "seeds_c5.jpg",
        submittedAt: "2026-02-01T08:00:00Z",
        verificationStatus: "verified",
        verifiedAt: "2026-02-01T13:00:00Z",
      },
      {
        cropStatus: "fertilized",
        photoFileName: "fert_c5.jpg",
        submittedAt: "2026-02-15T09:00:00Z",
        verificationStatus: "verified",
        verifiedAt: "2026-02-15T15:00:00Z",
      },
      {
        cropStatus: "growing",
        photoFileName: "growing_c6.jpg",
        submittedAt: "2026-01-10T10:00:00Z",
        verificationStatus: "verified",
        verifiedAt: "2026-01-10T15:00:00Z",
      },
      {
        cropStatus: "ready_for_harvest",
        photoFileName: "harvest_c6.jpg",
        submittedAt: "2026-02-01T07:00:00Z",
        verificationStatus: "verified",
        verifiedAt: "2026-02-01T11:00:00Z",
      },
      {
        cropStatus: "harvested",
        photoFileName: "harvested_c6.jpg",
        submittedAt: "2026-02-15T08:00:00Z",
        verificationStatus: "verified",
        verifiedAt: "2026-02-15T13:00:00Z",
      },
      {
        cropStatus: "delivered",
        photoFileName: "delivery_c5.jpg",
        submittedAt: "2026-03-15T07:00:00Z",
        verificationStatus: "disputed",
        disputeReason:
          "Photo shows different crop variety than contracted. Volume appears significantly below 1,500 kg.",
      },
    ],
    pendingBuyerConfirmation: false,
    buyerConfirmedDelivery: false,
    disputeFlag: true,
  },
  {
    id: "c6",
    crop: "Saging (Banana)",
    volumeKg: 4000,
    targetDate: "2026-05-30",
    status: "completed",
    cropStatus: "delivered",
    progress: 100,
    buyerName: "Metro Fresh Foods",
    matchedCooperative: mockCooperatives[2],
    escrowAmount: 120000,
    createdAt: "2025-12-01",
    milestoneEvidence: [
      {
        cropStatus: "seeds_planted",
        photoFileName: "seeds_c6.jpg",
        submittedAt: "2025-12-15T08:00:00Z",
        verificationStatus: "verified",
        verifiedAt: "2025-12-15T13:00:00Z",
      },
      {
        cropStatus: "fertilized",
        photoFileName: "fert_c6.jpg",
        submittedAt: "2025-12-28T09:00:00Z",
        verificationStatus: "verified",
        verifiedAt: "2025-12-28T14:00:00Z",
      },
      {
        cropStatus: "growing",
        photoFileName: "growing_c6.jpg",
        submittedAt: "2026-01-10T10:00:00Z",
        verificationStatus: "verified",
        verifiedAt: "2026-01-10T15:00:00Z",
      },
      {
        cropStatus: "ready_for_harvest",
        photoFileName: "harvest_c6.jpg",
        submittedAt: "2026-02-01T07:00:00Z",
        verificationStatus: "verified",
        verifiedAt: "2026-02-01T11:00:00Z",
      },
      {
        cropStatus: "harvested",
        photoFileName: "harvested_c6.jpg",
        submittedAt: "2026-02-15T08:00:00Z",
        verificationStatus: "verified",
        verifiedAt: "2026-02-15T13:00:00Z",
      },
      {
        cropStatus: "delivered",
        photoFileName: "delivery_c6.jpg",
        submittedAt: "2026-03-01T06:00:00Z",
        verificationStatus: "verified",
        verifiedAt: "2026-03-01T10:00:00Z",
      },
    ],
    pendingBuyerConfirmation: false,
    buyerConfirmedDelivery: true,
    disputeFlag: false,
  },
  {
    id: "c7",
    crop: "Mangga (Mango)",
    volumeKg: 1200,
    targetDate: "2026-04-30",
    status: "completed",
    cropStatus: "delivered",
    progress: 100,
    buyerName: "Manuel Santos (Solo Farmer)",
    matchedCooperative: undefined,
    escrowAmount: 36000,
    createdAt: "2025-11-01",
    milestoneEvidence: [
      {
        cropStatus: "seeds_planted",
        photoFileName: "seeds_c7_solo.jpg",
        submittedAt: "2025-11-15T08:00:00Z",
        verificationStatus: "verified",
        verifiedAt: "2025-11-15T13:00:00Z",
      },
      {
        cropStatus: "fertilized",
        photoFileName: "fert_c7_solo.jpg",
        submittedAt: "2025-11-28T09:00:00Z",
        verificationStatus: "verified",
        verifiedAt: "2025-11-28T14:00:00Z",
      },
      {
        cropStatus: "growing",
        photoFileName: "growing_c7_solo.jpg",
        submittedAt: "2025-12-10T10:00:00Z",
        verificationStatus: "verified",
        verifiedAt: "2025-12-10T15:00:00Z",
      },
      {
        cropStatus: "ready_for_harvest",
        photoFileName: "harvest_c7_solo.jpg",
        submittedAt: "2026-01-05T07:00:00Z",
        verificationStatus: "verified",
        verifiedAt: "2026-01-05T11:00:00Z",
      },
      {
        cropStatus: "harvested",
        photoFileName: "harvested_c7_solo.jpg",
        submittedAt: "2026-01-20T08:00:00Z",
        verificationStatus: "verified",
        verifiedAt: "2026-01-20T13:00:00Z",
      },
      {
        cropStatus: "delivered",
        photoFileName: "delivery_c7_solo.jpg",
        submittedAt: "2026-02-10T06:00:00Z",
        verificationStatus: "verified",
        verifiedAt: "2026-02-10T10:00:00Z",
      },
    ],
    pendingBuyerConfirmation: false,
    buyerConfirmedDelivery: true,
    disputeFlag: false,
  },
  {
    id: "c8",
    crop: "Eggplant",
    volumeKg: 500,
    targetDate: "2026-10-15",
    status: "matched",
    cropStatus: "pending",
    progress: 0,
    buyerName: "Makati Fresh Market",
    matchedCooperative: mockCooperatives[0],
    escrowAmount: 0,
    createdAt: "2026-03-20",
    milestoneEvidence: [],
    pendingBuyerConfirmation: false,
    buyerConfirmedDelivery: false,
    disputeFlag: false,
  },
];

export const VERIFIED_PROGRESS_MAP: Record<CropStatus, number> = {
  pending: 0,
  seeds_planted: 25,
  fertilized: 40,
  growing: 60,
  ready_for_harvest: 80,
  harvested: 95,
  delivered: 100,
};

export const useAppStore = create<AppState>((set, get) => ({
  // ── useAppStore initial state ──────────────────────────────────────────────
  contracts: mockContracts,
  cooperatives: mockCooperatives,
  soloFarmers: mockSoloFarmers,
  activeView: "dashboard",
  selectedContractId: null,
  confirmedAllocations: JSON.parse(
    localStorage.getItem("confirmedAllocations") || "[]",
  ),
  users: [], // Initialize as empty; will sync with useStore for smsStatus
  broadcastMessages: [],
  farmPlots: [], // Initialize as empty; will sync with useStore for smsStatus

  confirmAllocation: (contractId) => {
    const { confirmedAllocations } = get();

    if (confirmedAllocations.includes(contractId)) return;

    const next = [...confirmedAllocations, contractId];
    localStorage.setItem("confirmedAllocations", JSON.stringify(next));
    set({ confirmedAllocations: next });
  },

  addBroadcastMessage: (text) => {
    const msg: BroadcastMessage = {
      id: `bcast-${Date.now()}`,
      text,
      time: new Date().toLocaleTimeString("en-PH", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
    set((s) => ({ broadcastMessages: [...s.broadcastMessages, msg] }));
  },
  clearBroadcastMessages: () => set({ broadcastMessages: [] }),
  setActiveView: (view) => set({ activeView: view }),
  selectContract: (id) => set({ selectedContractId: id }),

  addContract: (demand) => {
    const newContract: Contract = {
      id: `c${Date.now()}`,
      crop: demand.crop,
      volumeKg: demand.volumeKg,
      targetDate: demand.targetDate,
      status: "open",
      cropStatus: "pending",
      progress: 0,
      buyerName: "Metro Fresh Foods",
      escrowAmount: 0,
      createdAt: new Date().toISOString().split("T")[0],
      milestoneEvidence: [],
      pendingBuyerConfirmation: false,
      buyerConfirmedDelivery: false,
      disputeFlag: false,
    };
    set((s) => ({ contracts: [...s.contracts, newContract] }));
    return newContract;
  },

  matchContract: (contractId, coopId) => {
    const coop = get().cooperatives.find((c) => c.id === coopId);
    if (!coop) return;
    set((s) => ({
      contracts: s.contracts.map((c) =>
        c.id === contractId
          ? {
              ...c,
              status: "matched" as ContractStatus,
              matchedCooperative: coop,
              progress: 10,
            }
          : c,
      ),
    }));
  },

  // acceptContract: merged — updates both useAppStore status and useStore timeline
  acceptContract: (contractId) => {
    set((s) => ({
      contracts: s.contracts.map((c) =>
        c.id === contractId
          ? { ...c, status: "accepted" as ContractStatus, progress: 15 }
          : c,
      ),
    }));
  },

  declineContract: (contractId) => {
    set((s) => ({
      contracts: s.contracts.map((c) =>
        c.id === contractId
          ? { ...c, status: "declined" as ContractStatus, progress: 0 }
          : c,
      ),
    }));
  },

  fundContract: (contractId) => {
    set((s) => ({
      contracts: s.contracts.map((c) =>
        c.id === contractId
          ? {
              ...c,
              status: "funded" as ContractStatus,
              escrowAmount: c.volumeKg * 30,
              progress: Math.max(c.progress, 20),
            }
          : c,
      ),
    }));
  },

  updateCropStatus: (contractId, status) => {
    set((s) => ({
      contracts: s.contracts.map((c) =>
        c.id === contractId
          ? {
              ...c,
              cropStatus: status,
              progress: VERIFIED_PROGRESS_MAP[status],
              status:
                status === "delivered"
                  ? ("completed" as ContractStatus)
                  : c.status,
            }
          : c,
      ),
    }));
  },

  // updateFarmerSmsStatus: merged — updates cooperative members (useAppStore) AND
  // users / farmPlots / contract timeline (useStore)
  updateFarmerSmsStatus: (contractId, farmerId, status) => {
    set((s) => {
      // 1. Update cooperative member smsStatus inside the matched contract (useAppStore)
      const updatedContracts = s.contracts.map((c) => {
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
      });

      // 2. Update User smsStatus (useStore) — map FarmerSmsStatus → useStore smsStatus
      const userStatus = (
        ["pending", "notified", "planted", "declined"] as const
      ).includes(status as any)
        ? (status as "pending" | "notified" | "planted" | "declined")
        : undefined;

      const updatedUsers = userStatus
        ? s.users.map((u) =>
            u.id === farmerId ? { ...u, smsStatus: userStatus } : u,
          )
        : s.users;

      const statusStr = status as string;
      const updatedPlots = s.farmPlots.map((p) =>
        p.assignedFarmerId === farmerId
          ? {
              ...p,
              status:
                statusStr === "declined"
                  ? ("declined" as PlotStatus)
                  : statusStr === "planted" || statusStr === "harvested"
                    ? (statusStr as PlotStatus)
                    : p.status,
            }
          : p,
      );

      return {
        contracts: updatedContracts,
        users: updatedUsers,
        farmPlots: updatedPlots,
      };
    });
  },

  addCoopMember: (coopId, farmer) => {
    set((s) => ({
      cooperatives: s.cooperatives.map((coop) =>
        coop.id === coopId
          ? {
              ...coop,
              members: [...coop.members, farmer],
              totalHectares: parseFloat(
                (coop.totalHectares + farmer.hectares).toFixed(2),
              ),
            }
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
          totalHectares: parseFloat(
            (coop.totalHectares - (removed?.hectares ?? 0)).toFixed(2),
          ),
        };
      }),
    }));
  },

  updateCoopMemberCrops: (coopId, farmerId, crops) => {
    set((s) => ({
      cooperatives: s.cooperatives.map((coop) =>
        coop.id !== coopId
          ? coop
          : {
              ...coop,
              members: coop.members.map((f) =>
                f.id === farmerId ? ({ ...f, crops } as any) : f,
              ),
            },
      ),
    }));
  },

  submitMilestoneEvidence: (contractId, cropStatus, photoFileName) => {
    const evidence: MilestoneEvidence = {
      cropStatus,
      photoFileName,
      submittedAt: new Date().toISOString(),
      verificationStatus: "pending_verification",
    };
    set((s) => ({
      contracts: s.contracts.map((c) => {
        if (c.id !== contractId) return c;
        const existingIdx = c.milestoneEvidence.findIndex(
          (e) => e.cropStatus === cropStatus,
        );
        const updatedEvidence =
          existingIdx >= 0
            ? c.milestoneEvidence.map((e, i) =>
                i === existingIdx ? evidence : e,
              )
            : [...c.milestoneEvidence, evidence];
        return {
          ...c,
          cropStatus,
          escrowAmount:
            c.escrowAmount === 0 ? c.volumeKg * 30 : c.escrowAmount,
          pendingBuyerConfirmation:
            cropStatus === "delivered" ? true : c.pendingBuyerConfirmation,
          milestoneEvidence: updatedEvidence,
        };
      }),
    }));
  },

  verifyMilestone: (contractId, cropStatus) => {
    set((s) => ({
      contracts: s.contracts.map((c) => {
        if (c.id !== contractId) return c;
        const updatedEvidence = c.milestoneEvidence.map((e) =>
          e.cropStatus === cropStatus
            ? {
                ...e,
                verificationStatus: "verified" as MilestoneVerificationStatus,
                verifiedAt: new Date().toISOString(),
              }
            : e,
        );
        const isDelivery = cropStatus === "delivered";
        return {
          ...c,
          progress: VERIFIED_PROGRESS_MAP[cropStatus],
          status: isDelivery ? ("completed" as ContractStatus) : c.status,
          buyerConfirmedDelivery: isDelivery ? true : c.buyerConfirmedDelivery,
          pendingBuyerConfirmation: isDelivery
            ? false
            : c.pendingBuyerConfirmation,
          milestoneEvidence: updatedEvidence,
        };
      }),
    }));
  },

  disputeMilestone: (contractId, cropStatus, reason) => {
    set((s) => ({
      contracts: s.contracts.map((c) => {
        if (c.id !== contractId) return c;
        const existingIdx = c.milestoneEvidence.findIndex(
          (e) => e.cropStatus === cropStatus,
        );
        const updatedEvidence =
          existingIdx >= 0
            ? c.milestoneEvidence.map((e) =>
                e.cropStatus === cropStatus
                  ? {
                      ...e,
                      verificationStatus: "disputed" as MilestoneVerificationStatus,
                      disputeReason: reason,
                    }
                  : e,
              )
            : [
                ...c.milestoneEvidence,
                {
                  cropStatus,
                  photoFileName: "Dispute filed",
                  submittedAt: new Date().toISOString(),
                  verificationStatus: "disputed" as MilestoneVerificationStatus,
                  disputeReason: reason,
                },
              ];
        return { ...c, disputeFlag: true, milestoneEvidence: updatedEvidence };
      }),
    }));
  },

  resolveDispute: (contractId) => {
    set((s) => ({
      contracts: s.contracts.map((c) => {
        if (c.id !== contractId) return c;
        const updatedEvidence = c.milestoneEvidence.map((e) =>
          e.verificationStatus === "disputed"
            ? {
                ...e,
                verificationStatus:
                  "pending_verification" as MilestoneVerificationStatus,
                disputeReason: undefined,
              }
            : e,
        );
        return { ...c, disputeFlag: false, milestoneEvidence: updatedEvidence };
      }),
    }));
  },

  resetContracts: () => {
    set({
      contracts: JSON.parse(JSON.stringify(mockContracts)),
      selectedContractId: null,
    });
  },
  updateContract: (contractId, partial) => {
    set((s) => ({
      contracts: s.contracts.map((c) =>
        c.id === contractId ? { ...c, ...partial } : c,
      ),
    }));
  },
}));
