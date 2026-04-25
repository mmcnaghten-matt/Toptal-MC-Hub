import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { SurveyRecord } from "@/data/surveyData";
import { supabase } from "@/integrations/supabase/client";

interface UserInfo {
  name: string;
  enterprise: string;
  department: string;
  role: string;
  email: string;
}

interface SurveyContextType {
  responses: Record<string, number>;
  setResponse: (questionId: string, optionIndex: number) => void;
  userInfo: UserInfo;
  setUserInfo: (info: UserInfo) => void;
  record: SurveyRecord | null;
  setRecord: (record: SurveyRecord | null) => void;
  completedRecords: SurveyRecord[];
  addCompletedRecord: (record: SurveyRecord) => void;
  deleteRecord: (id: string) => Promise<void>;
  updateRecordRecommendations: (id: string, recommendations: string) => void;
  resetSurvey: () => void;
  loading: boolean;
}

const SurveyContext = createContext<SurveyContextType | null>(null);

export function SurveyProvider({ children }: { children: ReactNode }) {
  const [responses, setResponses] = useState<Record<string, number>>({});
  const [userInfo, setUserInfo] = useState<UserInfo>({ name: "", enterprise: "", department: "", role: "", email: "" });
  const [record, setRecord] = useState<SurveyRecord | null>(null);
  const [completedRecords, setCompletedRecords] = useState<SurveyRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Load records from Supabase on mount
  useEffect(() => {
    const fetchRecords = async () => {
      const { data, error } = await supabase
        .from("survey_records")
        .select("*")
        .order("completed_at", { ascending: false });

      if (!error && data) {
        setCompletedRecords(
          data.map((r) => ({
            id: r.id,
            name: r.name,
            enterprise: r.enterprise,
            department: r.department || "",
            role: r.role || "",
            email: r.email,
            responses: r.responses as Record<string, number>,
            pillarScores: r.pillar_scores,
            completedAt: r.completed_at,
            recommendations: (r as any).recommendations || undefined,
          }))
        );
      }
      setLoading(false);
    };
    fetchRecords();
  }, []);

  const setResponse = (questionId: string, optionIndex: number) => {
    setResponses((prev) => ({ ...prev, [questionId]: optionIndex }));
  };

  const addCompletedRecord = async (rec: SurveyRecord) => {
    // Insert into Supabase and return the generated id
    const { data, error } = await supabase.from("survey_records").insert({
      name: rec.name,
      enterprise: rec.enterprise,
      department: rec.department || null,
      role: rec.role || null,
      email: rec.email,
      responses: rec.responses,
      pillar_scores: rec.pillarScores,
      completed_at: rec.completedAt,
    }).select("id").single();

    if (!error && data) {
      const savedRec = { ...rec, id: data.id };
      setCompletedRecords((prev) => [savedRec, ...prev]);
      // Update the active record with the DB id so ResultsPage can save recommendations
      setRecord(savedRec);
    } else {
      console.error("Failed to save survey record:", error);
      setCompletedRecords((prev) => [rec, ...prev]);
    }
  };

  const deleteRecord = async (id: string) => {
    const { error } = await supabase.from("survey_records").delete().eq("id", id);
    if (!error) {
      setCompletedRecords((prev) => prev.filter((r) => r.id !== id));
    } else {
      console.error("Failed to delete survey record:", error);
    }
  };

  const updateRecordRecommendations = (id: string, recommendations: string) => {
    setCompletedRecords((prev) =>
      prev.map((existing) =>
        existing.id === id ? { ...existing, recommendations } : existing
      )
    );
    setRecord((prev) =>
      prev?.id === id ? { ...prev, recommendations } : prev
    );
  };

  const resetSurvey = () => {
    setResponses({});
    setUserInfo({ name: "", enterprise: "", department: "", role: "", email: "" });
    setRecord(null);
  };

  return (
    <SurveyContext.Provider value={{ responses, setResponse, userInfo, setUserInfo, record, setRecord, completedRecords, addCompletedRecord, deleteRecord, updateRecordRecommendations, resetSurvey, loading }}>
      {children}
    </SurveyContext.Provider>
  );
}

export function useSurvey() {
  const ctx = useContext(SurveyContext);
  if (!ctx) throw new Error("useSurvey must be used within SurveyProvider");
  return ctx;
}
