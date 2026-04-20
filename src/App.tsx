import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { PortfolioProvider } from "@/lib/portfolio-context";
import { NotificationsProvider } from "@/lib/notifications-context";
import PriceTickSimulator from "@/lib/PriceTickSimulator";
import PageTransition from "@/components/layout/PageTransition";
import Index from "./pages/Index.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import Vaults from "./pages/Vaults.tsx";
import VaultDetail from "./pages/VaultDetail.tsx";
import Leaderboard from "./pages/Leaderboard.tsx";
import Profile from "./pages/Profile.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const AnimatedRoutes = () => {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageTransition><Index /></PageTransition>} />
        <Route path="/dashboard" element={<PageTransition><Dashboard /></PageTransition>} />
        <Route path="/vaults" element={<PageTransition><Vaults /></PageTransition>} />
        <Route path="/vault/:id" element={<PageTransition><VaultDetail /></PageTransition>} />
        <Route path="/leaderboard" element={<PageTransition><Leaderboard /></PageTransition>} />
        <Route path="/profile" element={<PageTransition><Profile /></PageTransition>} />
        <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />
      </Routes>
    </AnimatePresence>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <PortfolioProvider>
        <NotificationsProvider>
          <PriceTickSimulator />
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AnimatedRoutes />
          </BrowserRouter>
        </NotificationsProvider>
      </PortfolioProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
