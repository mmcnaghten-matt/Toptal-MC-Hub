import type { DiagnosticConfig } from '../types';
import aiMaturity from './ai-maturity';
import mePlatform from './me-platform';

const registry: Record<string, DiagnosticConfig> = {
  'ai-maturity': aiMaturity,
  'me-platform': mePlatform,
};

export function getDiagnosticConfig(slug: string): DiagnosticConfig | undefined {
  return registry[slug];
}

export default registry;
