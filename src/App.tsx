import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AuthGate from "./components/AuthGate";
import Landing from "./pages/Landing";
import MCServices from "./pages/MCServices";
import WayOfWorking from "./pages/WayOfWorking";
import AccountMarketIntel from "./pages/AccountMarketIntel";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AdminIndustryInsights from "./pages/AdminIndustryInsights";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthGate>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/services" element={<MCServices />} />
            <Route path="/way-of-working" element={<WayOfWorking />} />
            <Route path="/industry-insights" element={<Index />} />
            <Route path="/account-market-intel" element={<AccountMarketIntel />} />
            <Route path="/client-insights" element={<AccountMarketIntel />} />
            <Route path="/admin/industry-insights" element={<AdminIndustryInsights />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthGate>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
