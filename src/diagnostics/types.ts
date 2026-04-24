export interface QuestionConfig {
  id: string;
  dimension: string;
  text: string;
  options: string[];
}

export interface DimensionConfig {
  id: string;
  label: string;
  shortName: string;
}

export interface DiagnosticConfig {
  slug: string;
  title: string;
  description: string;
  dimensions: DimensionConfig[];
  questions: QuestionConfig[];
}

export interface StrategicRecommendation {
  title: string;
  rationale: string;
  strategic_action: string;
  expected_impact: string;
}

export interface RecommendationContent {
  maturity_level: 'Foundational' | 'Developing' | 'Integrated' | 'Predictive' | 'Optimized & Adaptive';
  recommendations: StrategicRecommendation[];
}

export interface DiagnosticRespondent {
  id: string;
  diagnostic_id: string;
  full_name: string;
  job_title: string;
  department: string;
  email: string;
  created_at: string;
}

export interface DiagnosticResponse {
  id: string;
  diagnostic_id: string;
  respondent_id: string;
  answers: Record<string, number>;
  score_summary: Record<string, number> | null;
  submitted_at: string;
}

export interface DiagnosticRecommendation {
  id: string;
  diagnostic_id: string;
  response_id: string;
  content: RecommendationContent;
  model_used: string | null;
  generated_at: string;
}
