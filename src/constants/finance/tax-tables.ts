/**
 * Tabelas de retenções tributárias para o módulo financeiro.
 *
 * Diferente das tabelas do HR (folha de pagamento), estas tabelas são usadas
 * para cálculo de retenções em lançamentos financeiros (notas de serviço, etc).
 *
 * Fontes:
 * - IRRF: Tabela progressiva mensal (MP 1.294/2025)
 * - INSS: Portaria Interministerial MPS/MF nº 6, de 10/01/2025
 * - ISS: LC 116/2003 (alíquota varia por município, default 5%)
 * - PIS/COFINS: Lei 10.637/2002 e Lei 10.833/2003
 * - CSLL: Lei 7.689/1988
 */

// ============================================================================
// IRRF — Imposto de Renda Retido na Fonte (Tabela Progressiva 2025/2026)
// ============================================================================

export interface IRRFRetentionBracket {
  min: number;
  max: number;
  rate: number;
  deduction: number;
}

export const IRRF_TABLE: IRRFRetentionBracket[] = [
  { min: 0, max: 2259.2, rate: 0, deduction: 0 },
  { min: 2259.21, max: 2826.65, rate: 0.075, deduction: 169.44 },
  { min: 2826.66, max: 3751.05, rate: 0.15, deduction: 381.44 },
  { min: 3751.06, max: 4664.68, rate: 0.225, deduction: 662.77 },
  { min: 4664.69, max: Infinity, rate: 0.275, deduction: 896.0 },
];

// ============================================================================
// ISS — Imposto Sobre Serviços
// ============================================================================

/** Alíquota padrão do ISS (5% — máximo permitido pela LC 116/2003) */
export const ISS_DEFAULT_RATE = 0.05;

// ============================================================================
// INSS — Contribuição Previdenciária Progressiva 2025/2026
// ============================================================================

export interface INSSRetentionBracket {
  min: number;
  max: number;
  rate: number;
}

export const INSS_TABLE: INSSRetentionBracket[] = [
  { min: 0, max: 1518.0, rate: 0.075 },
  { min: 1518.01, max: 2793.88, rate: 0.09 },
  { min: 2793.89, max: 4190.83, rate: 0.12 },
  { min: 4190.84, max: 8157.41, rate: 0.14 },
];

/** Teto máximo de contribuição INSS 2025 */
export const INSS_MAX_CONTRIBUTION = 951.63;

// ============================================================================
// PIS — Programa de Integração Social
// ============================================================================

/** PIS regime cumulativo (Lei 9.718/1998) */
export const PIS_CUMULATIVO = 0.0065;

/** PIS regime não-cumulativo (Lei 10.637/2002) */
export const PIS_NAO_CUMULATIVO = 0.0165;

// ============================================================================
// COFINS — Contribuição para Financiamento da Seguridade Social
// ============================================================================

/** COFINS regime cumulativo (Lei 9.718/1998) */
export const COFINS_CUMULATIVO = 0.03;

/** COFINS regime não-cumulativo (Lei 10.833/2003) */
export const COFINS_NAO_CUMULATIVO = 0.076;

// ============================================================================
// CSLL — Contribuição Social sobre o Lucro Líquido
// ============================================================================

/** CSLL alíquota padrão (Lei 7.689/1988) */
export const CSLL_RATE = 0.09;
