-- Add Business Transformation diagnostic config
-- Respondent: BT2026 / Admin: BTADMIN2026

INSERT INTO public.diagnostic_configs (id, title, description, respondent_password_hash, admin_password_hash, questions, is_active)
VALUES (
  'business-transformation',
  'Business Transformation Maturity Checkup',
  'Assess your organization''s business transformation maturity across five capability pillars and receive a personalized transformation roadmap.',
  '$2b$10$quril0HzT4UxURma9iqAZ.OsGUM1s.2nZHUOmpTPWuPev4fGsJcdW',
  '$2b$10$enla7WoOJpUuYQRORtYw7OS7OzvJKC5a4iNVWuTYZLa9omMULaiTG',
  '[]'::jsonb,
  true
);
