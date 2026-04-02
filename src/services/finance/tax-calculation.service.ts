/**
 * Serviço de cálculo de retenções tributárias para lançamentos financeiros.
 *
 * Todas as funções são puras (sem dependências externas) e podem ser usadas
 * tanto para preview (dry-run) quanto para persistência.
 */

import {
  COFINS_CUMULATIVO,
  COFINS_NAO_CUMULATIVO,
  CSLL_RATE,
  INSS_MAX_CONTRIBUTION,
  INSS_TABLE,
  IRRF_TABLE,
  ISS_DEFAULT_RATE,
  PIS_CUMULATIVO,
  PIS_NAO_CUMULATIVO,
} from '@/constants/finance/tax-tables';

// ============================================================================
// TYPES
// ============================================================================

export type TaxType = 'IRRF' | 'ISS' | 'INSS' | 'PIS' | 'COFINS' | 'CSLL';

export type TaxRegime = 'CUMULATIVO' | 'NAO_CUMULATIVO';

export interface TaxResult {
  taxType: TaxType;
  grossAmount: number;
  rate: number;
  amount: number;
  description: string;
}

export interface RetentionSummary {
  retentions: TaxResult[];
  totalRetained: number;
  netAmount: number;
}

export interface RetentionConfig {
  applyIRRF?: boolean;
  applyISS?: boolean;
  applyINSS?: boolean;
  applyPIS?: boolean;
  applyCOFINS?: boolean;
  applyCSLL?: boolean;
  issRate?: number;
  taxRegime?: TaxRegime;
}

// ============================================================================
// HELPER — arredondamento para 2 casas decimais
// ============================================================================

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

// ============================================================================
// IRRF — Cálculo progressivo (tabela única sem acumular por faixa)
// ============================================================================

export function calculateIRRF(grossAmount: number): TaxResult {
  if (grossAmount <= 0) {
    return {
      taxType: 'IRRF',
      grossAmount,
      rate: 0,
      amount: 0,
      description: 'IRRF — Isento (valor zero ou negativo)',
    };
  }

  // Encontra a faixa aplicável
  const bracket = IRRF_TABLE.find(
    (b) => grossAmount >= b.min && grossAmount <= b.max,
  );

  if (!bracket || bracket.rate === 0) {
    return {
      taxType: 'IRRF',
      grossAmount,
      rate: 0,
      amount: 0,
      description: 'IRRF — Isento',
    };
  }

  const amount = round2(grossAmount * bracket.rate - bracket.deduction);
  const effectiveRate = round2((amount / grossAmount) * 10000) / 10000;

  return {
    taxType: 'IRRF',
    grossAmount,
    rate: effectiveRate,
    amount: Math.max(0, amount),
    description: `IRRF — Alíquota ${(bracket.rate * 100).toFixed(1)}% (efetiva ${(effectiveRate * 100).toFixed(2)}%)`,
  };
}

// ============================================================================
// ISS — Alíquota fixa
// ============================================================================

export function calculateISS(serviceAmount: number, rate?: number): TaxResult {
  const effectiveRate = rate ?? ISS_DEFAULT_RATE;

  if (serviceAmount <= 0 || effectiveRate <= 0) {
    return {
      taxType: 'ISS',
      grossAmount: serviceAmount,
      rate: 0,
      amount: 0,
      description: 'ISS — Não aplicável',
    };
  }

  const amount = round2(serviceAmount * effectiveRate);

  return {
    taxType: 'ISS',
    grossAmount: serviceAmount,
    rate: effectiveRate,
    amount,
    description: `ISS — ${(effectiveRate * 100).toFixed(1)}%`,
  };
}

// ============================================================================
// INSS — Cálculo progressivo por faixas
// ============================================================================

export function calculateINSS(salary: number): TaxResult {
  if (salary <= 0) {
    return {
      taxType: 'INSS',
      grossAmount: salary,
      rate: 0,
      amount: 0,
      description: 'INSS — Não aplicável',
    };
  }

  let totalContribution = 0;
  let previousLimit = 0;

  for (const bracket of INSS_TABLE) {
    if (salary <= previousLimit) break;

    const bracketBase = Math.min(salary, bracket.max) - previousLimit;
    if (bracketBase > 0) {
      totalContribution += bracketBase * bracket.rate;
    }
    previousLimit = bracket.max;
  }

  // Aplica teto
  totalContribution = Math.min(totalContribution, INSS_MAX_CONTRIBUTION);
  totalContribution = round2(totalContribution);

  const effectiveRate =
    salary > 0 ? round2((totalContribution / salary) * 10000) / 10000 : 0;

  return {
    taxType: 'INSS',
    grossAmount: salary,
    rate: effectiveRate,
    amount: totalContribution,
    description: `INSS — Progressivo (efetiva ${(effectiveRate * 100).toFixed(2)}%)`,
  };
}

// ============================================================================
// PIS — Alíquota fixa por regime
// ============================================================================

export function calculatePIS(
  amount: number,
  regime: TaxRegime = 'CUMULATIVO',
): TaxResult {
  if (amount <= 0) {
    return {
      taxType: 'PIS',
      grossAmount: amount,
      rate: 0,
      amount: 0,
      description: 'PIS — Não aplicável',
    };
  }

  const rate =
    regime === 'NAO_CUMULATIVO' ? PIS_NAO_CUMULATIVO : PIS_CUMULATIVO;
  const taxAmount = round2(amount * rate);

  return {
    taxType: 'PIS',
    grossAmount: amount,
    rate,
    amount: taxAmount,
    description: `PIS — ${regime === 'NAO_CUMULATIVO' ? 'Não-Cumulativo' : 'Cumulativo'} (${(rate * 100).toFixed(2)}%)`,
  };
}

// ============================================================================
// COFINS — Alíquota fixa por regime
// ============================================================================

export function calculateCOFINS(
  amount: number,
  regime: TaxRegime = 'CUMULATIVO',
): TaxResult {
  if (amount <= 0) {
    return {
      taxType: 'COFINS',
      grossAmount: amount,
      rate: 0,
      amount: 0,
      description: 'COFINS — Não aplicável',
    };
  }

  const rate =
    regime === 'NAO_CUMULATIVO' ? COFINS_NAO_CUMULATIVO : COFINS_CUMULATIVO;
  const taxAmount = round2(amount * rate);

  return {
    taxType: 'COFINS',
    grossAmount: amount,
    rate,
    amount: taxAmount,
    description: `COFINS — ${regime === 'NAO_CUMULATIVO' ? 'Não-Cumulativo' : 'Cumulativo'} (${(rate * 100).toFixed(1)}%)`,
  };
}

// ============================================================================
// CSLL — Alíquota fixa
// ============================================================================

export function calculateCSLL(amount: number): TaxResult {
  if (amount <= 0) {
    return {
      taxType: 'CSLL',
      grossAmount: amount,
      rate: 0,
      amount: 0,
      description: 'CSLL — Não aplicável',
    };
  }

  const taxAmount = round2(amount * CSLL_RATE);

  return {
    taxType: 'CSLL',
    grossAmount: amount,
    rate: CSLL_RATE,
    amount: taxAmount,
    description: `CSLL — ${(CSLL_RATE * 100).toFixed(0)}%`,
  };
}

// ============================================================================
// CÁLCULO CONSOLIDADO
// ============================================================================

export function calculateAllRetentions(
  grossAmount: number,
  config: RetentionConfig,
): RetentionSummary {
  const retentions: TaxResult[] = [];

  if (config.applyIRRF) {
    retentions.push(calculateIRRF(grossAmount));
  }

  if (config.applyISS) {
    retentions.push(calculateISS(grossAmount, config.issRate));
  }

  if (config.applyINSS) {
    retentions.push(calculateINSS(grossAmount));
  }

  if (config.applyPIS) {
    retentions.push(calculatePIS(grossAmount, config.taxRegime));
  }

  if (config.applyCOFINS) {
    retentions.push(calculateCOFINS(grossAmount, config.taxRegime));
  }

  if (config.applyCSLL) {
    retentions.push(calculateCSLL(grossAmount));
  }

  const totalRetained = round2(
    retentions.reduce((sum, r) => sum + r.amount, 0),
  );

  return {
    retentions,
    totalRetained,
    netAmount: round2(grossAmount - totalRetained),
  };
}
