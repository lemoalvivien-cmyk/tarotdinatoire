import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, setQueryClientRef } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AdminRoute } from "@/components/auth/AdminRoute";
import { MaintenanceGuard } from "@/components/layout/MaintenanceGuard";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { CookieBanner } from "@/components/cookies/CookieBanner";
import { PWAInstallPrompt } from "@/components/pwa/PWAInstallPrompt";
import RemoveLovableBadge from "@/components/RemoveLovableBadge";
import { validateRoutes, CANONICAL_ROUTES, LEGACY_REDIRECTS } from "@/utils/routeValidator";

// Public Pages
import Landing from "./pages/public/Landing";
import Auth from "./pages/public/Auth";
import Disclaimer from "./pages/public/Disclaimer";
import Status from "./pages/public/Status";
import Spreads from "./pages/public/Spreads";
import SpreadDetail from "./pages/public/SpreadDetail";
import CardsList from "./pages/public/CardsList";
import CardDetail from "./pages/public/CardDetail";
import Unsubscribe from "./pages/public/Unsubscribe";
import Privacy from "./pages/legal/Privacy";
import Terms from "./pages/legal/Terms";
import Imprint from "./pages/legal/Imprint";
import CookiesPolicy from "./pages/legal/CookiesPolicy";
import ExerciseRights from "./pages/legal/ExerciseRights";
import NotFound from "./pages/NotFound";

// Protected App Pages
import Dashboard from "./pages/app/Dashboard";
import Onboarding from "./pages/app/Onboarding";
import NewReading from "./pages/app/NewReading";
import History from "./pages/app/History";
import Favorites from "./pages/app/Favorites";
import ReadingDetail from "./pages/app/ReadingDetail";
import ReadingRedirect from "./pages/app/ReadingRedirect";
import ReadingSession from "./pages/app/ReadingSession";
import Profile from "./pages/app/Profile";
import Diagnostic from "./pages/app/Diagnostic";

// Admin Pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminFeatureFlags from "./pages/admin/AdminFeatureFlags";
import AdminPrompts from "./pages/admin/AdminPrompts";
import AdminAuditLogs from "./pages/admin/AdminAuditLogs";
import AdminEdgeTest from "./pages/admin/AdminEdgeTest";
import AdminCardAssets from "./pages/admin/AdminCardAssets";
import AdminSpreads from "./pages/admin/AdminSpreads";
import AdminLeads from "./pages/admin/AdminLeads";
import AdminStats from "./pages/admin/AdminStats";
import AdminProdChecklist from "./pages/admin/AdminProdChecklist";
import AdminImportDeck from "./pages/admin/AdminImportDeck";

const queryClient = new QueryClient();

// FIX #1/#7 (SEC-12/SEC-13): Register queryClient so AuthContext.signOut() can
// call queryClient.clear() — prevents stale data after logout on shared devices
setQueryClientRef(queryClient);

// Validate all routes at startup (dev AND build - throws if invalid)
const allPaths = [
  ...Object.values(CANONICAL_ROUTES),
  ...Object.keys(LEGACY_REDIRECTS),
];
validateRoutes(allPaths);

// Log route dump for verification (dev only)
if (import.meta.env.DEV) {
  console.log('[ROUTE DUMP] Canonical routes:');
  console.table(Object.entries(CANONICAL_ROUTES).map(([key, path]) => ({ key, path })));
  console.log('[ROUTE DUMP] Legacy redirects:');
  console.table(Object.entries(LEGACY_REDIRECTS).map(([from, to]) => ({ from, to })));
}

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Sonner />
          <BrowserRouter>
            <MaintenanceGuard>
              <Routes>
                {/* ========== PUBLIC ROUTES (ASCII only) ========== */}
                <Route path="/" element={<Landing />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/disclaimer" element={<Disclaimer />} />
                <Route path="/status" element={<Status />} />
                <Route path="/tirages" element={<Spreads />} />
                <Route path="/tirages/:slug" element={<SpreadDetail />} />
                <Route path="/cartes" element={<CardsList />} />
                <Route path="/cartes/:id" element={<CardDetail />} />
                <Route path="/unsubscribe" element={<Unsubscribe />} />
                <Route path="/legal/privacy" element={<Privacy />} />
                <Route path="/legal/terms" element={<Terms />} />
                <Route path="/legal/imprint" element={<Imprint />} />
                <Route path="/legal/cookies" element={<CookiesPolicy />} />
                <Route path="/legal/rights" element={<ExerciseRights />} />
                
                {/* ========== PROTECTED APP ROUTES (ASCII only) ========== */}
                <Route path="/app" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/app/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/app/onboarding" element={<ProtectedRoute requireOnboarding={false} requirePremium={false}><Onboarding /></ProtectedRoute>} />
                <Route path="/app/new" element={<ProtectedRoute><NewReading /></ProtectedRoute>} />
                <Route path="/app/tirage/:slug" element={<ProtectedRoute><NewReading /></ProtectedRoute>} />
                <Route path="/app/result/:sessionId" element={<ProtectedRoute><ReadingSession /></ProtectedRoute>} />
                <Route path="/app/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
                <Route path="/app/favorites" element={<ProtectedRoute><Favorites /></ProtectedRoute>} />
                <Route path="/app/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                <Route path="/app/reading/:id" element={<ProtectedRoute><ReadingDetail /></ProtectedRoute>} />
                <Route path="/app/diagnostic" element={<ProtectedRoute><Diagnostic /></ProtectedRoute>} />
                
                {/* ========== ADMIN ROUTES (ASCII only) ========== */}
                <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
                <Route path="/admin/flags" element={<AdminRoute><AdminFeatureFlags /></AdminRoute>} />
                <Route path="/admin/prompts" element={<AdminRoute><AdminPrompts /></AdminRoute>} />
                <Route path="/admin/audit-logs" element={<AdminRoute><AdminAuditLogs /></AdminRoute>} />
                <Route path="/admin/edge-test" element={<AdminRoute><AdminEdgeTest /></AdminRoute>} />
                <Route path="/admin/card-assets" element={<AdminRoute><AdminCardAssets /></AdminRoute>} />
                <Route path="/admin/spreads" element={<AdminRoute><AdminSpreads /></AdminRoute>} />
                <Route path="/admin/leads" element={<AdminRoute><AdminLeads /></AdminRoute>} />
                <Route path="/admin/stats" element={<AdminRoute><AdminStats /></AdminRoute>} />
                <Route path="/admin/prod-check" element={<AdminRoute><AdminProdChecklist /></AdminRoute>} />
                <Route path="/admin/import-deck" element={<AdminRoute><AdminImportDeck /></AdminRoute>} />
                
                {/* ========== LEGACY REDIRECTS (ASCII slugs only) ========== */}
                 <Route path="/dashboard" element={<Navigate to="/app/dashboard" replace />} />
                 <Route path="/statut" element={<Navigate to="/status" replace />} />
                <Route path="/clause-non-responsabilite" element={<Navigate to="/disclaimer" replace />} />
                <Route path="/juridique/confidentialite" element={<Navigate to="/legal/privacy" replace />} />
                <Route path="/mentions/juridiques" element={<Navigate to="/legal/terms" replace />} />
                <Route path="/mentions-juridiques" element={<Navigate to="/legal/terms" replace />} />
                <Route path="/mentions-legales" element={<Navigate to="/legal/imprint" replace />} />
                <Route path="/app/lecture/:id" element={<ReadingRedirect />} />
                <Route path="/admin/journaux-audit" element={<Navigate to="/admin/audit-logs" replace />} />
                
                {/* ========== 404 ========== */}
                <Route path="*" element={<NotFound />} />
              </Routes>
              <CookieBanner />
              <PWAInstallPrompt />
              <RemoveLovableBadge />
            </MaintenanceGuard>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
