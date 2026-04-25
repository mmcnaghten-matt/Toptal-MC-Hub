-- Rename "AI Navigator Checkup" → "AI Maturity Checkup" in diagnostic_configs
UPDATE public.diagnostic_configs
SET title = 'AI Maturity Checkup'
WHERE id = 'ai-maturity' AND title = 'AI Navigator Checkup';
