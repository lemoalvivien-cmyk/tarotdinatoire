import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";

// Pages
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import About from "./pages/About";
import Privacy from "./pages/legal/Privacy";
import Terms from "./pages/legal/Terms";
import Legal from "./pages/legal/Legal";
import NotFound from "./pages/NotFound";

// Protected pages (will be created next)
import Tirage from "./pages/Tirage";
import Journal from "./pages/Journal";
import Profil from "./pages/Profil";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/a-propos" element={<About />} />
            <Route path="/politique-confidentialite" element={<Privacy />} />
            <Route path="/cgu" element={<Terms />} />
            <Route path="/mentions-legales" element={<Legal />} />
            
            {/* Protected routes */}
            <Route path="/tirage" element={<Tirage />} />
            <Route path="/journal" element={<Journal />} />
            <Route path="/profil" element={<Profil />} />
            
            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
