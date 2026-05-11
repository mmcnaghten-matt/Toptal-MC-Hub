-- Add Workforce Transformation diagnostic config
-- Respondent: WT2026 / Admin: WTADMIN2026

INSERT INTO public.diagnostic_configs (id, title, description, respondent_password_hash, admin_password_hash, questions, is_active)
VALUES (
  'workforce-transformation',
  'Workforce Transformation Maturity Checkup',
  'Assess your organization''s workforce transformation maturity across five capability pillars and receive a personalized transformation roadmap.',
  '$2b$10$pF13rsutkvMt2JhQ8tJV.OxtRkSzWKLYSrpeb7yRc1/Q4USHbVqtO',
  '$2b$10$SVWw/MZ4WXWwIJVMPjgGceAJd0sUZIzOMrkhcL9DPofWz7wKAfIWS',
  '[]'::jsonb,
  true
);
