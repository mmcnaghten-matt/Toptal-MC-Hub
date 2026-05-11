-- Add Performance Improvement diagnostic config
-- finance-transformation row already existed in the database
-- Performance Improvement — Respondent: PI2026 / Admin: PIADMIN2026

INSERT INTO public.diagnostic_configs (id, title, description, respondent_password_hash, admin_password_hash, questions, is_active)
VALUES (
  'performance-improvement',
  'Performance Improvement Maturity Checkup',
  'Assess your organization''s operational performance maturity across six capability pillars and receive a personalized improvement roadmap.',
  '$2b$10$rZ8mB592B2eKCTr8UEYm5.DBe2gBOY8MFS7RvziGYMFzBa9QHw7Pe',
  '$2b$10$raLdm0jsL.DxV6pWVy/lXO.rhXwBZBpju/P6PdkmsqU.dl0rLOF3u',
  '[]'::jsonb,
  true
);
