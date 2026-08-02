-- Add ERP PMO Maturity diagnostic config
-- Respondent: ERP2026 / Admin: ERP2026-Admin

INSERT INTO public.diagnostic_configs (id, title, description, respondent_password_hash, admin_password_hash, questions, is_active)
VALUES (
  'erp-pmo-maturity',
  'ERP PMO Maturity Diagnostic',
  'Assess your ERP program management maturity across five pillars — Strategy, Governance & Executive Alignment, Estimation Accuracy & Earned Value Analytics, Scope, Process Standardization & Change Management, Delivery Execution, Risk & Multi-Vendor Management, and Data Integration, PPM Tooling & Advanced PMO Analytics — and receive a prioritized improvement roadmap.',
  '$2b$10$egiv3YRNJiEY75ysa/FLHeCS7Zt3I/zR7skweX9GbR7wIDN1pb.7m',
  '$2b$10$hp8sI1iZJsy2oQNE2J0KPuYKH6GWTaHLCha7wZLZpY09ytv4ZSG6i',
  '[]'::jsonb,
  true
);
