/**
 * Contribuição Sindical (Art. 578-591 CLT — pós-Reforma Trabalhista)
 *
 * Desde a Lei 13.467/2017 (Reforma Trabalhista), a contribuição sindical
 * é FACULTATIVA — depende de autorização prévia e expressa do empregado.
 *
 * Valor tradicional: 1 dia de salário por ano, descontado normalmente em março.
 * Pode ser configurada com uma taxa customizada via HrTenantConfig.
 */

export interface UnionContributionParams {
  /** Salário base mensal do empregado */
  baseSalary: number;
  /** Se o empregado autorizou expressamente a contribuição */
  employeeOptedIn: boolean;
  /** Se a empresa habilitou contribuição sindical */
  tenantEnabled: boolean;
  /** Taxa da contribuição (padrão: 1/30 ≈ 0.0333 = 1 dia de salário) */
  contributionRate?: number;
  /** Mês de referência da folha (1-12) */
  referenceMonth: number;
  /** Mês em que a contribuição é descontada (padrão: 3 = março) */
  deductionMonth?: number;
}

export interface UnionContributionResult {
  /** Se deve aplicar o desconto */
  shouldDeduct: boolean;
  /** Valor do desconto */
  amount: number;
  /** Descrição para o item de folha */
  description: string;
}

/** Taxa padrão: 1 dia de salário = 1/30 */
const DEFAULT_CONTRIBUTION_RATE = 1 / 30;

/** Mês padrão de desconto: março */
const DEFAULT_DEDUCTION_MONTH = 3;

export function calculateUnionContribution(
  params: UnionContributionParams,
): UnionContributionResult {
  const {
    baseSalary,
    employeeOptedIn,
    tenantEnabled,
    contributionRate,
    referenceMonth,
    deductionMonth = DEFAULT_DEDUCTION_MONTH,
  } = params;

  // Must be enabled at tenant level AND employee must opt in
  if (!tenantEnabled || !employeeOptedIn) {
    return {
      shouldDeduct: false,
      amount: 0,
      description: 'Contribuição Sindical — não autorizada',
    };
  }

  // Only deduct in the configured month
  if (referenceMonth !== deductionMonth) {
    return {
      shouldDeduct: false,
      amount: 0,
      description: 'Contribuição Sindical — fora do mês de desconto',
    };
  }

  const rate = contributionRate ?? DEFAULT_CONTRIBUTION_RATE;
  const amount = Math.round(baseSalary * rate * 100) / 100;

  return {
    shouldDeduct: true,
    amount,
    description: `Contribuição Sindical (${(rate * 100).toFixed(2)}%)`,
  };
}
