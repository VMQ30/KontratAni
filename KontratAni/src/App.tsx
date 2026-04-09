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
import MobileView from "@/components/mobile/MobileView.tsx";
import KontratAniApp from "@/components/simulator/KontratAniApp.tsx";

const queryClient = new QueryClient();

const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Auth />} />

        <Route path="/buyer-dashboard" element={<BuyerLayout />} />
        <Route path="/coop-dashboard" element={<Manager />} />
        <Route path="/farmer-dashboard" element={<FarmerLayout />} />
        <Route path="/mobile-view" element={<MobileView />} />

        {/* Simulator — single entry point, persona switcher lives inside */}
        <Route path="/simulator" element={<KontratAniApp />} />

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
