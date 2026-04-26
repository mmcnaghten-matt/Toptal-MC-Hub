import { Routes, Route } from "react-router-dom";
import { SurveyProvider } from "@/cannes-diagnostic/context/SurveyContext";
import LoginPage from "@/cannes-diagnostic/pages/LoginPage";
import LandingPage from "@/cannes-diagnostic/pages/LandingPage";
import UserInfoPage from "@/cannes-diagnostic/pages/UserInfoPage";
import SurveyPage from "@/cannes-diagnostic/pages/SurveyPage";
import ResultsPage from "@/cannes-diagnostic/pages/ResultsPage";
import ThankYouPage from "@/cannes-diagnostic/pages/ThankYouPage";
import AdminPage from "@/cannes-diagnostic/pages/AdminPage";

export default function CannesDiagnosticShell() {
  return (
    <SurveyProvider>
      <Routes>
        <Route index element={<LoginPage />} />
        <Route path="landing" element={<LandingPage />} />
        <Route path="user-info" element={<UserInfoPage />} />
        <Route path="survey" element={<SurveyPage />} />
        <Route path="results" element={<ResultsPage />} />
        <Route path="thank-you" element={<ThankYouPage />} />
        <Route path="admin" element={<AdminPage />} />
      </Routes>
    </SurveyProvider>
  );
}
