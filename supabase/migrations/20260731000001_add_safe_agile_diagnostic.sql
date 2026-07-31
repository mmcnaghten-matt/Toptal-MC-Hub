-- Add SAFe Agile Maturity diagnostic config
-- Respondent: SAFE2026 / Admin: SAFE2026-Admin

INSERT INTO public.diagnostic_configs (id, title, description, respondent_password_hash, admin_password_hash, questions, is_active)
VALUES (
  'safe-agile-maturity',
  'SAFe Agile Maturity Assessment',
  'Assess your organization''s SAFe Agile maturity across five pillars — Strategy & LPM, ART Execution & Flow, Technical Agility & DevOps, Event Quality & Alignment, and Lean-Agile Culture & Leadership — and receive a prioritized improvement roadmap.',
  '$2b$10$NAJPz64TWicWg4FbIipGf.V60ZM8OrLCbeuH/mhqBuAT5mG57jy3e',
  '$2b$10$YwZhRI9AP0ZL8KXHNLY9mehycGv2AD4FEovFi/WeWJajPXd3R9XeW',
  '[]'::jsonb,
  true
);
