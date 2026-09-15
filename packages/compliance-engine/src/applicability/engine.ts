import { RuleDefinition, Jurisdiction } from '../types';

export interface ApplicabilityContext {
  productCategory?: string;
  isImported?: boolean;
  netQuantityVal?: number;
  netQuantityUnit?: string;
  jurisdiction?: Jurisdiction;
  scanDate?: string;
}

export interface ApplicabilityResult {
  isApplicable: boolean;
  reason?: string;
}

export class ApplicabilityEngine {
  public static evaluate(rule: RuleDefinition, context: ApplicabilityContext = {}): ApplicabilityResult {
    // 1. Jurisdiction Check
    if (context.jurisdiction && rule.jurisdiction !== 'CENTRAL' && rule.jurisdiction !== context.jurisdiction) {
      return {
        isApplicable: false,
        reason: `Rule jurisdiction (${rule.jurisdiction}) does not apply to target jurisdiction (${context.jurisdiction}).`,
      };
    }

    // 2. Category Applicability Check
    if (
      rule.applicableCategories &&
      !rule.applicableCategories.includes('ALL') &&
      context.productCategory &&
      !rule.applicableCategories.includes(context.productCategory)
    ) {
      return {
        isApplicable: false,
        reason: `Rule applies to categories [${rule.applicableCategories.join(', ')}] but product category is '${context.productCategory}'.`,
      };
    }

    // 3. Rule-Specific Applicability Criteria
    if (rule.ruleId === 'LM-RULE-008') {
      // Country of Origin rule
      if (context.isImported === false) {
        return {
          isApplicable: false,
          reason: 'Country of Origin mandatory statement under Rule 6(1)(aa) is specifically required for imported commodities.',
        };
      }
    }

    if (rule.ruleId === 'LM-RULE-006') {
      // Unit Sale Price rule
      if (context.netQuantityVal !== undefined && context.netQuantityVal < 10) {
        return {
          isApplicable: false,
          reason: 'Unit Sale Price under Rule 6(11) is exempt for small net quantity packages under 10 g / 10 ml.',
        };
      }
    }

    return {
      isApplicable: true,
    };
  }
}
