import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/lib/auth-context";
import { ProfileProvider } from "@/lib/profile-context";
import { PreferencesProvider } from "@/lib/preferences-context";
import { PortfolioProvider } from "@/lib/portfolio-context";
import { NotificationsProvider } from "@/lib/notifications-context";
import AchievementWatcher from "@/lib/AchievementWatcher";
import RequireAuth from "@/components/auth/RequireAuth";
import PageTransition from "@/components/layout/PageTransition";
import Index from "./pages/Index.tsx";
import Auth from "./pages/Auth.tsx";
import ResetPassword from "./pages/ResetPassword.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import Vaults from "./pages/Vaults.tsx";
import VaultDetail from "./pages/VaultDetail.tsx";
import Leaderboard from "./pages/Leaderboard.tsx";
import Profile from "./pages/Profile.tsx";
import Notifications from "./pages/Notifications.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const AnimatedRoutes = () => {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageTransition><Index /></PageTransition>} />
        <Route path="/auth" element={<PageTransition><Auth /></PageTransition>} />
        <Route path="/dashboard" element={<RequireAuth><PageTransition><Dashboard /></PageTransition></RequireAuth>} />
        <Route path="/vaults" element={<RequireAuth><PageTransition><Vaults /></PageTransition></RequireAuth>} />
        <Route path="/vault/:id" element={<RequireAuth><PageTransition><VaultDetail /></PageTransition></RequireAuth>} />
        <Route path="/leaderboard" element={<RequireAuth><PageTransition><Leaderboard /></PageTransition></RequireAuth>} />
        <Route path="/profile" element={<RequireAuth><PageTransition><Profile /></PageTransition></RequireAuth>} />
        <Route path="/notifications" element={<RequireAuth><PageTransition><Notifications /></PageTransition></RequireAuth>} />
        <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />
      </Routes>
    </AnimatePresence>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrowserRouter>
        <AuthProvider>
          <ProfileProvider>
            <PortfolioProvider>
              <NotificationsProvider>
                <PriceTickSimulator />
                <AchievementWatcher />
                <Toaster />
                <Sonner />
                <AnimatedRoutes />
              </NotificationsProvider>
            </PortfolioProvider>
          </ProfileProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
