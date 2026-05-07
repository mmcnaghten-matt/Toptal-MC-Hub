import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { calculateTotalScore, getMaturityLevel } from "@/cannes-diagnostic/data/cannesSurveyData";
import { supabase } from "@/integrations/supabase/client";
import type { AIRecommendation } from "@/cannes-diagnostic/lib/exportResultsPdf";

export interface UserInfo {
  name: string;
  company: string;
  department: string;
  role: string;
  email: string;
}

export interface CompletedRecord {
  id: string;
  userInfo: UserInfo;
  answers: Record<string, number>;
  totalScore: number;
  maturityLevel: number;
  maturityName: string;
  maturityTitle: string;
  completedAt: string;
  aiRecommendations: AIRecommendation[];
}

interface SurveyState {
  isAuthenticated: boolean;
  isAdmin: boolean;
  userInfo: UserInfo | null;
  answers: Record<string, number>;
  completedRecords: CompletedRecord[];
  loading: boolean;
  setAuthenticated: (val: boolean) => void;
  setAdmin: (val: boolean) => void;
  setUserInfo: (info: UserInfo) => void;
  setAnswer: (questionId: string, value: number) => void;
  addCompletedRecord: () => Promise<void>;
  updateRecordAiRecs: (id: string, recs: AIRecommendation[]) => Promise<void>;
  deleteRecord: (id: string) => Promise<void>;
  resetSurvey: () => void;
}

const SurveyContext = createContext<SurveyState | null>(null);

export function SurveyProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setAuthenticated] = useState(false);
  const [isAdmin, setAdmin] = useState(false);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [completedRecords, setCompletedRecords] = useState<CompletedRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecords = async () => {
      const { data, error } = await supabase
        .from("cannes_survey_records" as any)
        .select("*")
        .order("completed_at", { ascending: false });

      if (!error && data) {
        setCompletedRecords(
          (data as any[]).map((r) => ({
            id: r.id,
            userInfo: {
              name: r.name,
              company: r.company,
              department: r.department || "",
              role: r.role || "",
              email: r.email,
            },
            answers: (r.answers as Record<string, number>) || {},
            totalScore: r.total_score,
            maturityLevel: r.maturity_level,
            maturityName: r.maturity_name,
            maturityTitle: r.maturity_title,
            completedAt: r.completed_at,
            aiRecommendations: (r.ai_recommendations as unknown as AIRecommendation[]) || [],
          }))
        );
      }
      setLoading(false);
    };
    fetchRecords();
  }, []);

  const setAnswer = (questionId: string, value: number) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const addCompletedRecord = async () => {
    if (!userInfo) return;
    const totalScore = calculateTotalScore(answers);
    const maturity = getMaturityLevel(totalScore);

    const { data, error } = await supabase
      .from("cannes_survey_records" as any)
      .insert({
        name: userInfo.name,
        company: userInfo.company,
        department: userInfo.department || null,
        role: userInfo.role || null,
        email: userInfo.email,
        answers: answers,
        total_score: totalScore,
        maturity_level: maturity.level,
        maturity_name: maturity.name,
        maturity_title: maturity.title,
      })
      .select()
      .single();

    if (!error && data) {
      const record: CompletedRecord = {
        id: (data as any).id,
        userInfo,
        answers: { ...answers },
        totalScore,
        maturityLevel: maturity.level,
        maturityName: maturity.name,
        maturityTitle: maturity.title,
        completedAt: (data as any).completed_at,
        aiRecommendations: [],
      };
      setCompletedRecords((prev) => [record, ...prev]);
    }
  };

  const updateRecordAiRecs = async (id: string, recs: AIRecommendation[]) => {
    await supabase
      .from("cannes_survey_records" as any)
      .update({ ai_recommendations: recs as unknown as Record<string, unknown>[] } as any)
      .eq("id", id);

    setCompletedRecords((prev) =>
      prev.map((r) => (r.id === id ? { ...r, aiRecommendations: recs } : r))
    );
  };

  const deleteRecord = async (id: string) => {
    const { error } = await supabase
      .from("cannes_survey_records" as any)
      .delete()
      .eq("id", id);

    if (!error) {
      setCompletedRecords((prev) => prev.filter((r) => r.id !== id));
    }
  };

  const resetSurvey = () => {
    setUserInfo(null);
    setAnswers({});
  };

  return (
    <SurveyContext.Provider
      value={{
        isAuthenticated,
        isAdmin,
        userInfo,
        answers,
        completedRecords,
        loading,
        setAuthenticated,
        setAdmin,
        setUserInfo,
        setAnswer,
        addCompletedRecord,
        updateRecordAiRecs,
        deleteRecord,
        resetSurvey,
      }}
    >
      {children}
    </SurveyContext.Provider>
  );
}

export function useSurvey() {
  const ctx = useContext(SurveyContext);
  if (!ctx) throw new Error("useSurvey must be used within SurveyProvider");
  return ctx;
}
