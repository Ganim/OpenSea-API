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
};

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
