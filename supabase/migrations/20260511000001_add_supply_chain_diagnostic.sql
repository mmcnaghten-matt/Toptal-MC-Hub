-- Add Supply Chain diagnostic config
-- Respondent: SC2026 / Admin: SCADMIN2026

INSERT INTO public.diagnostic_configs (id, title, description, respondent_password_hash, admin_password_hash, questions, is_active)
VALUES (
  'supply-chain',
  'Supply Chain Maturity Checkup',
  'Assess your organization''s supply chain maturity across five capability pillars and receive a personalized transformation roadmap.',
  '$2b$10$yJ.TSv/uAjpKwxwQ8bY52.pP3LBYPu7i7GaZk4B5IMM9Xo4TpYgL6',
  '$2b$10$j2z29zZ1KG8RxbQIldE6gePcpSC.n7ZT34Kgn2S2U6.IxDEsnoO6y',
  '[]'::jsonb,
  true
);
