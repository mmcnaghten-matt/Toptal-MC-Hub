import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SurveyProvider } from "@/context/SurveyContext";
import LoginPage from "./pages/LoginPage";
import LandingPage from "./pages/LandingPage";
import UserInfoPage from "./pages/UserInfoPage";
import SurveyPage from "./pages/SurveyPage";
import ResultsPage from "./pages/ResultsPage";
import ThankYouPage from "./pages/ThankYouPage";
import AdminReportPage from "./pages/AdminReportPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <SurveyProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LoginPage />} />
            <Route path="/landing" element={<LandingPage />} />
            <Route path="/user-info" element={<UserInfoPage />} />
            <Route path="/survey/:pillarId" element={<SurveyPage />} />
            <Route path="/results" element={<ResultsPage />} />
            <Route path="/thank-you" element={<ThankYouPage />} />
            <Route path="/admin" element={<AdminReportPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </SurveyProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
