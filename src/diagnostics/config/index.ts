import type { DiagnosticConfig } from '../types';
import aiMaturity from './ai-maturity';

const registry: Record<string, DiagnosticConfig> = {
  'ai-maturity': aiMaturity,
};

export function getDiagnosticConfig(slug: string): DiagnosticConfig | undefined {
  return registry[slug];
}

export default registry;
