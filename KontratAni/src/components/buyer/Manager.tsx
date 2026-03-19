// import { useState } from "react";
// import { ManagerSidebar } from "@/components/manager/ManagerSidebar";
// import { ManagerDashboardView } from "@/components/manager/ManagerDashboardView";
// import { ContractInboxView, type InboxContract } from "@/components/manager/ContractInboxView";
// import { ProfileLandView } from "@/components/manager/ProfileLandView";
// import { useAppStore } from "@/store/useAppStore";

// const VIEWS: Record<string, string> = {
//   dashboard: "Dashboard",
//   inbox:     "Contract Inbox",
//   profile:   "Profile & Land Registry",
// };

// /** Map store ContractStatus → InboxContract status */
// function toInboxStatus(s: string): InboxContract["status"] {
//   switch (s) {
//     case "accepted":
//     case "funded":
//     case "in_progress":
//     case "completed":
//       return "accepted";
//     case "declined":
//       return "declined";
//     default:
//       return "pending"; // open | matched
//   }
// }

// export default function Manager() {
//   const [activeView, setActiveView] = useState("dashboard");
//   const [isSolo, setIsSolo]         = useState(false);

//   // ── Store selectors ────────────────────────────────────────────────────────
//   const storeContracts = useAppStore((s) => s.contracts);
//   const cooperatives   = useAppStore((s) => s.cooperatives);
//   const acceptContract = useAppStore((s) => s.acceptContract);
//   const declineContract = useAppStore((s) => s.declineContract);

//   // Primary cooperative (index 0 — the one this manager belongs to)
//   const primaryCoop = cooperatives[0];
//   const farmerCount = primaryCoop?.members.length ?? 0;
//   const totalHa     = primaryCoop?.totalHectares ?? 0;
//   const coopName    = primaryCoop?.name ?? "Malinao Farmers Cooperative";

//   // ── Map store contracts → InboxContract shape ──────────────────────────────
//   const inboxContracts: InboxContract[] = storeContracts.map((c) => ({
//     id:           c.id,
//     buyer:        c.buyerName,
//     buyerType:    "Institutional Buyer",
//     crop:         c.crop,
//     volumeKg:     c.volumeKg,
//     pricePerKg:   c.escrowAmount > 0 ? Math.round(c.escrowAmount / c.volumeKg) : 30,
//     escrowAmount: c.escrowAmount,
//     targetDate:   c.targetDate,
//     terms:        "Delivery as agreed. Grade A quality required.",
//     status:       toInboxStatus(c.status),
//     postedAt:     c.createdAt,
//     progress:     c.progress,
//   }));

//   // ── Handlers (delegate to store) ───────────────────────────────────────────
//   const onAccept  = (id: string) => acceptContract(id);
//   const onDecline = (id: string) => declineContract(id);

//   const renderView = () => {
//     switch (activeView) {
//       case "dashboard":
//         return (
//           <ManagerDashboardView
//             contracts={inboxContracts}
//             isSolo={isSolo}
//             farmerCount={farmerCount}
//             totalHa={totalHa}
//             setActiveView={setActiveView}
//             selectContract={() => setActiveView("inbox")}
//           />
//         );
//       case "inbox":
//         return (
//           <ContractInboxView
//             contracts={inboxContracts}
//             isSolo={isSolo}
//             onAccept={onAccept}
//             onDecline={onDecline}
//           />
//         );
//       case "profile":
//         return (
//           <ProfileLandView
//             isSolo={isSolo}
//             setIsSolo={setIsSolo}
//             coopId={primaryCoop?.id ?? "coop1"}
//           />
//         );
//       default:
//         return null;
//     }
//   };

//   return (
//     <div className="flex min-h-screen bg-background">
//       <ManagerSidebar
//         activeView={activeView}
//         setActiveView={setActiveView}
//         isSolo={isSolo}
//         farmerName="Juan dela Cruz"
//         coop={coopName}
//       />

//       {/* Content — offset by sidebar width (w-64 = 256px) */}
//       <main className="ml-64 flex-1 px-8 py-8">
//         <div className="mb-6">
//           <h2 className="text-xl font-semibold text-foreground">{VIEWS[activeView]}</h2>
//         </div>
//         {renderView()}
//       </main>
//     </div>
//   );
// }