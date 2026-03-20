import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AnimatePresence } from "framer-motion";
import Auth from "./pages/Auth.tsx";
import NotFound from "./pages/NotFound.tsx";
import BuyerLayout from "@/components/buyer/BuyerLayout.tsx";
import Manager from "@/components/manager/Manager.tsx";
import { FarmerLayout } from "@/components/farmer/FarmerLayout.tsx";
import MobileView from "@/components/mobile/MobileView.tsx"; // 👈 i-add ito

// placeholder muna itech connect connect nalang
const CoopDashboard = () => (
  <div className="p-10 text-2xl font-bold">
    🤝 Cooperative Dashboard (Coming Soon)
  </div>
);

const queryClient = new QueryClient();

const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Auth />} />

        {/* Dito siya icconnect also need pala gumawa tayo ng layout kasi yun yung magsserve as a master
        container between the role's dashboard view and sidebard view. */}
        <Route path="/buyer-dashboard" element={<BuyerLayout />} />
        <Route path="/coop-dashboard" element={<Manager />} />
        <Route path="/farmer-dashboard" element={<FarmerLayout />} />

        {/* 👇 Mobile SMS View */}
        <Route path="/mobile-view" element={<MobileView />} />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </AnimatePresence>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AnimatedRoutes />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;