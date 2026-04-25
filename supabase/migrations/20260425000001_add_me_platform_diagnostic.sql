-- Add M&E Platform Maturity Diagnostic config
-- Respondent password: ME2026
-- Admin password:      MEADMIN2026
INSERT INTO public.diagnostic_configs (id, title, description, respondent_password_hash, admin_password_hash, questions, is_active)
VALUES (
  'me-platform',
  'M&E Platform Maturity Diagnostic',
  'Assess your organization''s readiness to transition from a linear media model to an optimized multi-sided platform.',
  '$2b$10$6zar7FiPn.eunDUxzQyy3ukdhPsAYtyZeXPpcXkQ/toyAVCiA3nsS',
  '$2b$10$zxkEKOp9dQdRWWt57G02.uuCBZeErLz70q0IGt4tGhAV3CPjRsAUS',
  '[]'::jsonb,
  true
);
