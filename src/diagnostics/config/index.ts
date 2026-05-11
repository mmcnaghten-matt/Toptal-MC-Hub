import type { DiagnosticConfig } from '../types';
import aiMaturity from './ai-maturity';
import mePlatform from './me-platform';
import financeTransformation from './finance-transformation';
import performanceImprovement from './performance-improvement';

const registry: Record<string, DiagnosticConfig> = {
  'ai-maturity': aiMaturity,
  'me-platform': mePlatform,
  'finance-transformation': financeTransformation,
  'performance-improvement': performanceImprovement,
};

export function getDiagnosticConfig(slug: string): DiagnosticConfig | undefined {
  return registry[slug];
}

export default registry;
