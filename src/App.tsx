import { lazy, Suspense } from "react";
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
import RemoveLovableBadge from "@/components/RemoveLovableBadge";
import { validateRoutes, CANONICAL_ROUTES, LEGACY_REDIRECTS } from "@/utils/routeValidator";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { rlsSafeRetry, STALE_MEDIUM } from "@/queries/queryConfig";

// ─── Public pages — eager (needed at first paint) ─────────────────────────────
import Landing from "./pages/public/Landing";
import Auth from "./pages/public/Auth";
import NotFound from "./pages/NotFound";
import ResetPassword from "./pages/public/ResetPassword";

// ─── Public pages — lazy ─────────────────────────────────────────────────────
const Disclaimer       = lazy(() => import("./pages/public/Disclaimer"));
const Status           = lazy(() => import("./pages/public/Status"));
const Spreads          = lazy(() => import("./pages/public/Spreads"));
const SpreadDetail     = lazy(() => import("./pages/public/SpreadDetail"));
const CardsList        = lazy(() => import("./pages/public/CardsList"));
const CardDetail       = lazy(() => import("./pages/public/CardDetail"));
const Unsubscribe      = lazy(() => import("./pages/public/Unsubscribe"));
const SharePage        = lazy(() => import("./pages/public/SharePage"));
const TarotCardsIndex  = lazy(() => import("./pages/public/TarotCardsIndex"));
const TarotCardMeaning = lazy(() => import("./pages/public/TarotCardMeaning"));

// ─── Legal pages — lazy ──────────────────────────────────────────────────────
const Privacy       = lazy(() => import("./pages/legal/Privacy"));
const Terms         = lazy(() => import("./pages/legal/Terms"));
const Imprint       = lazy(() => import("./pages/legal/Imprint"));
const CookiesPolicy = lazy(() => import("./pages/legal/CookiesPolicy"));
const ExerciseRights= lazy(() => import("./pages/legal/ExerciseRights"));

// ─── Protected app pages — lazy ──────────────────────────────────────────────
const Dashboard      = lazy(() => import("./pages/app/Dashboard"));
const DailyRitual    = lazy(() => import("./pages/app/DailyRitual"));
const Journey        = lazy(() => import("./pages/app/Journey"));
const Onboarding     = lazy(() => import("./pages/app/Onboarding"));
const NewReading     = lazy(() => import("./pages/app/NewReading"));
const History        = lazy(() => import("./pages/app/History"));
const Favorites      = lazy(() => import("./pages/app/Favorites"));
const ReadingDetail  = lazy(() => import("./pages/app/ReadingDetail"));
const ReadingRedirect= lazy(() => import("./pages/app/ReadingRedirect"));
const ReadingSession = lazy(() => import("./pages/app/ReadingSession"));
const Profile        = lazy(() => import("./pages/app/Profile"));
const Diagnostic     = lazy(() => import("./pages/app/Diagnostic"));

// ─── Admin pages — lazy (heaviest bundle, rarely visited) ────────────────────
const AdminDashboard      = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminFeatureFlags   = lazy(() => import("./pages/admin/AdminFeatureFlags"));
const AdminPrompts        = lazy(() => import("./pages/admin/AdminPrompts"));
const AdminAuditLogs      = lazy(() => import("./pages/admin/AdminAuditLogs"));
const AdminEdgeTest       = lazy(() => import("./pages/admin/AdminEdgeTest"));
const AdminCardAssets     = lazy(() => import("./pages/admin/AdminCardAssets"));
const AdminSpreads        = lazy(() => import("./pages/admin/AdminSpreads"));
const AdminLeads          = lazy(() => import("./pages/admin/AdminLeads"));
const AdminStats          = lazy(() => import("./pages/admin/AdminStats"));
const AdminProdChecklist  = lazy(() => import("./pages/admin/AdminProdChecklist"));
const AdminImportDeck     = lazy(() => import("./pages/admin/AdminImportDeck"));
const AdminAgentJobs      = lazy(() => import("./pages/admin/AdminAgentJobs"));

// ─── QueryClient ─────────────────────────────────────────────────────────────
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: rlsSafeRetry,
      staleTime: STALE_MEDIUM,
    },
  },
});

setQueryClientRef(queryClient);

// Route validation (dev + build)
const allPaths = [
  ...Object.values(CANONICAL_ROUTES),
  ...Object.keys(LEGACY_REDIRECTS),
];
validateRoutes(allPaths);

if (import.meta.env.DEV) {
  console.log('[ROUTE DUMP] Canonical routes:');
  console.table(Object.entries(CANONICAL_ROUTES).map(([key, path]) => ({ key, path })));
}

// ─── Suspense fallback ────────────────────────────────────────────────────────
function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <LoadingScreen message="Chargement…" />
    </div>
  );
}

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Sonner />
          <BrowserRouter>
            <MaintenanceGuard>
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  {/* ═══ PUBLIC ═══════════════════════════════════════════════ */}
                  <Route path="/" element={<Landing />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/disclaimer" element={<Disclaimer />} />
                  <Route path="/status" element={<Status />} />
                  <Route path="/tirages" element={<Spreads />} />
                  <Route path="/tirages/:slug" element={<SpreadDetail />} />
                  <Route path="/cartes" element={<CardsList />} />
                  <Route path="/cartes/:id" element={<CardDetail />} />
                  <Route path="/tarot" element={<TarotCardsIndex />} />
                  <Route path="/tarot/:slug" element={<TarotCardMeaning />} />
                  <Route path="/unsubscribe" element={<Unsubscribe />} />
                  <Route path="/partage/:shareId" element={<SharePage />} />
                  <Route path="/legal/privacy" element={<Privacy />} />
                  <Route path="/legal/terms" element={<Terms />} />
                  <Route path="/legal/imprint" element={<Imprint />} />
                  <Route path="/legal/cookies" element={<CookiesPolicy />} />
                  <Route path="/legal/rights" element={<ExerciseRights />} />

                  {/* ═══ PROTECTED APP ════════════════════════════════════════ */}
                  <Route path="/app" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                  <Route path="/app/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                  <Route path="/app/onboarding" element={<ProtectedRoute requireOnboarding={false} requirePremium={false}><Onboarding /></ProtectedRoute>} />
                  <Route path="/app/new" element={<ProtectedRoute><NewReading /></ProtectedRoute>} />
                  <Route path="/app/daily" element={<ProtectedRoute><DailyRitual /></ProtectedRoute>} />
                  <Route path="/app/journey" element={<ProtectedRoute><Journey /></ProtectedRoute>} />
                  <Route path="/app/tirage/:slug" element={<ProtectedRoute><NewReading /></ProtectedRoute>} />
                  <Route path="/app/result/:sessionId" element={<ProtectedRoute><ReadingSession /></ProtectedRoute>} />
                  <Route path="/app/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
                  <Route path="/app/favorites" element={<ProtectedRoute><Favorites /></ProtectedRoute>} />
                  <Route path="/app/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                  <Route path="/app/reading/:id" element={<ProtectedRoute><ReadingDetail /></ProtectedRoute>} />
                  <Route path="/app/diagnostic" element={<ProtectedRoute><Diagnostic /></ProtectedRoute>} />

                  {/* ═══ ADMIN ════════════════════════════════════════════════ */}
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
                  <Route path="/admin/agent-jobs" element={<AdminRoute><AdminAgentJobs /></AdminRoute>} />

                  {/* ═══ LEGACY REDIRECTS ══════════════════════════════════════ */}
                  <Route path="/dashboard" element={<Navigate to="/app/dashboard" replace />} />
                  <Route path="/statut" element={<Navigate to="/status" replace />} />
                  <Route path="/clause-non-responsabilite" element={<Navigate to="/disclaimer" replace />} />
                  <Route path="/juridique/confidentialite" element={<Navigate to="/legal/privacy" replace />} />
                  <Route path="/mentions/juridiques" element={<Navigate to="/legal/terms" replace />} />
                  <Route path="/mentions-juridiques" element={<Navigate to="/legal/terms" replace />} />
                  <Route path="/mentions-legales" element={<Navigate to="/legal/imprint" replace />} />
                  <Route path="/app/lecture/:id" element={<ReadingRedirect />} />
                  <Route path="/admin/journaux-audit" element={<Navigate to="/admin/audit-logs" replace />} />

                  {/* ═══ 404 ═══════════════════════════════════════════════════ */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
              <CookieBanner />
              <RemoveLovableBadge />
            </MaintenanceGuard>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
