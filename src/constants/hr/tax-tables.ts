/**
 * Tabelas de INSS e IRRF versionadas por ano.
 *
 * Ao iniciar um novo ano fiscal, adicione uma nova entrada com a chave do ano.
 * A função auxiliar `getTaxTable(year)` retorna a tabela mais recente caso o
 * ano solicitado ainda nao possua entrada propria.
 */

// ============================================================================
// INSS - Contribuicao previdenciaria progressiva
// ============================================================================

export interface INSSBracket {
  /** Limite superior da faixa (salario acumulado) */
  limit: number;
  /** Aliquota aplicada sobre a faixa */
  rate: number;
}

export interface INSSTable {
  brackets: INSSBracket[];
  /** Teto maximo de contribuicao */
  maxContribution: number;
}

export const INSS_TABLES: Record<number, INSSTable> = {
  2024: {
    brackets: [
      { limit: 1412.0, rate: 0.075 },
      { limit: 2666.68, rate: 0.09 },
      { limit: 4000.03, rate: 0.12 },
      { limit: 7786.02, rate: 0.14 },
    ],
    maxContribution: 908.86,
  },
  // 2025 — Portaria Interministerial MPS/MF nº 6, de 10/01/2025
  // Salário mínimo 2025: R$ 1.518,00
  2025: {
    brackets: [
      { limit: 1518.0, rate: 0.075 },
      { limit: 2793.88, rate: 0.09 },
      { limit: 4190.83, rate: 0.12 },
      { limit: 8157.41, rate: 0.14 },
    ],
    maxContribution: 951.63,
  },
};

// ============================================================================
// IRRF - Imposto de renda retido na fonte
// ============================================================================

export interface IRRFBracket {
  /** Limite superior da faixa (base de calculo) */
  limit: number;
  /** Aliquota aplicada */
  rate: number;
  /** Parcela a deduzir */
  deduction: number;
}

export interface IRRFTable {
  /** Base isenta - abaixo deste valor nao ha imposto */
  exemptLimit: number;
  brackets: IRRFBracket[];
}

export const IRRF_TABLES: Record<number, IRRFTable> = {
  2024: {
    exemptLimit: 2259.2,
    brackets: [
      { limit: 2826.65, rate: 0.075, deduction: 169.44 },
      { limit: 3751.05, rate: 0.15, deduction: 381.44 },
      { limit: 4664.68, rate: 0.225, deduction: 662.77 },
      { limit: Infinity, rate: 0.275, deduction: 896.0 },
    ],
  },
  // 2025 — Tabela progressiva mensal IRRF
  // Base: MP 1.294/2025 (faixa de isenção ampliada para R$ 2.259,20 mantida,
  // dedução por dependente R$ 189,59)
  2025: {
    exemptLimit: 2259.2,
    brackets: [
      { limit: 2826.65, rate: 0.075, deduction: 169.44 },
      { limit: 3751.05, rate: 0.15, deduction: 381.44 },
      { limit: 4664.68, rate: 0.225, deduction: 662.77 },
      { limit: Infinity, rate: 0.275, deduction: 896.0 },
    ],
  },
};

// ============================================================================
// IRRF - Dedução por dependente
// ============================================================================

export const IRRF_DEPENDANT_DEDUCTION: Record<number, number> = {
  2024: 189.59,
  2025: 189.59,
};

// ============================================================================
// Salário mínimo nacional
// ============================================================================

export const MINIMUM_WAGE: Record<number, number> = {
  2024: 1412.0,
  2025: 1518.0,
};

/**
 * Retorna a dedução por dependente para o ano solicitado.
 */
export function getDependantDeduction(year: number): number {
  if (IRRF_DEPENDANT_DEDUCTION[year]) return IRRF_DEPENDANT_DEDUCTION[year];

  const availableYears = Object.keys(IRRF_DEPENDANT_DEDUCTION)
    .map(Number)
    .sort((a, b) => b - a);

  return IRRF_DEPENDANT_DEDUCTION[availableYears[0]];
}

/**
 * Retorna o salário mínimo para o ano solicitado.
 */
export function getMinimumWage(year: number): number {
  if (MINIMUM_WAGE[year]) return MINIMUM_WAGE[year];

  const availableYears = Object.keys(MINIMUM_WAGE)
    .map(Number)
    .sort((a, b) => b - a);

  return MINIMUM_WAGE[availableYears[0]];
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Retorna a tabela INSS para o ano solicitado.
 * Se o ano nao possuir tabela propria, retorna a do ano mais recente disponivel.
 */
export function getINSSTable(year: number): INSSTable {
  if (INSS_TABLES[year]) return INSS_TABLES[year];

  const availableYears = Object.keys(INSS_TABLES)
    .map(Number)
    .sort((a, b) => b - a);

  return INSS_TABLES[availableYears[0]];
}

/**
 * Retorna a tabela IRRF para o ano solicitado.
 * Se o ano nao possuir tabela propria, retorna a do ano mais recente disponivel.
 */
export function getIRRFTable(year: number): IRRFTable {
  if (IRRF_TABLES[year]) return IRRF_TABLES[year];

  const availableYears = Object.keys(IRRF_TABLES)
    .map(Number)
    .sort((a, b) => b - a);

  return IRRF_TABLES[availableYears[0]];
}
