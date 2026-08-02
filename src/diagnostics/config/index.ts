import type { DiagnosticConfig } from '../types';
import aiMaturity from './ai-maturity';
import mePlatform from './me-platform';
import financeTransformation from './finance-transformation';
import performanceImprovement from './performance-improvement';
import supplyChain from './supply-chain';
import workforceTransformation from './workforce-transformation';
import businessTransformation from './business-transformation';
import growthStrategy from './growth-strategy';
import aiGovernanceMaturity from './ai-governance-maturity';
import aiValueRealization from './ai-value-realization';
import safeAgileMaturit from './safe-agile-maturity';
import erpPmoMaturity from './erp-pmo-maturity';

const registry: Record<string, DiagnosticConfig> = {
  'ai-maturity': aiMaturity,
  'me-platform': mePlatform,
  'finance-transformation': financeTransformation,
  'performance-improvement': performanceImprovement,
  'supply-chain': supplyChain,
  'workforce-transformation': workforceTransformation,
  'business-transformation': businessTransformation,
  'growth-strategy': growthStrategy,
  'ai-value-realization': aiValueRealization,
  'ai-governance-maturity': aiGovernanceMaturity,
  'safe-agile-maturity': safeAgileMaturit,
  'erp-pmo-maturity': erpPmoMaturity,
};

export function getDiagnosticConfig(slug: string): DiagnosticConfig | undefined {
  return registry[slug];
}

export default registry;
