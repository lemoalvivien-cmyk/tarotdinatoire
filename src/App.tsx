import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AdminRoute } from "@/components/auth/AdminRoute";
import { MaintenanceGuard } from "@/components/layout/MaintenanceGuard";

// Public Pages
import Landing from "./pages/public/Landing";
import Auth from "./pages/public/Auth";
import Disclaimer from "./pages/public/Disclaimer";
import Status from "./pages/public/Status";
import Privacy from "./pages/legal/Privacy";
import Terms from "./pages/legal/Terms";
import Imprint from "./pages/legal/Imprint";
import NotFound from "./pages/NotFound";

// Protected App Pages
import Dashboard from "./pages/app/Dashboard";
import Onboarding from "./pages/app/Onboarding";
import NewReading from "./pages/app/NewReading";
import History from "./pages/app/History";
import Favorites from "./pages/app/Favorites";
import ReadingDetail from "./pages/app/ReadingDetail";
import Profile from "./pages/app/Profile";

// Admin Pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminFeatureFlags from "./pages/admin/AdminFeatureFlags";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <MaintenanceGuard>
            <Routes>
              {/* ========== PUBLIC ROUTES ========== */}
              <Route path="/" element={<Landing />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/disclaimer" element={<Disclaimer />} />
              <Route path="/status" element={<Status />} />
              <Route path="/statut" element={<Navigate to="/status" replace />} />
              
              {/* Legal Pages */}
              <Route path="/legal/privacy" element={<Privacy />} />
              <Route path="/legal/terms" element={<Terms />} />
              <Route path="/legal/imprint" element={<Imprint />} />
              
              {/* ========== PROTECTED APP ROUTES ========== */}
              <Route path="/app" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/app/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
              <Route path="/app/new" element={<ProtectedRoute><NewReading /></ProtectedRoute>} />
              <Route path="/app/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
              <Route path="/app/favorites" element={<ProtectedRoute><Favorites /></ProtectedRoute>} />
              <Route path="/app/reading/:id" element={<ProtectedRoute><ReadingDetail /></ProtectedRoute>} />
              <Route path="/app/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              
              {/* ========== ADMIN ROUTES ========== */}
              <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
              <Route path="/admin/flags" element={<AdminRoute><AdminFeatureFlags /></AdminRoute>} />
              
              {/* ========== 404 ========== */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </MaintenanceGuard>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
