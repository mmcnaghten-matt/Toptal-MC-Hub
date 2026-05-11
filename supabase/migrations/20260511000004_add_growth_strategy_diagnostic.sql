-- Add Growth Strategy diagnostic config
-- Respondent: GS2026 / Admin: GSADMIN2026

INSERT INTO public.diagnostic_configs (id, title, description, respondent_password_hash, admin_password_hash, questions, is_active)
VALUES (
  'growth-strategy',
  'Growth Strategy Maturity Checkup',
  'Assess your organization''s growth strategy maturity across five capability pillars and receive a personalized growth roadmap.',
  '$2b$10$BdKWcQwIOL5EbBTiiWlLpeBGTfUiwCsdDMhyOj36odXs8EhXbpIH6',
  '$2b$10$rpilHz9U16A.AjsAm5wKHOqOtSZh3BTDRDD/ralLoLCCLDSuFa6cS',
  '[]'::jsonb,
  true
);
