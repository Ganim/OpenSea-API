/**
 * GPS (Guia da Previdência Social) — Contribuição Patronal
 *
 * Calcula as contribuições do empregador sobre a folha de pagamento:
 * - INSS Patronal: 20% sobre o total da remuneração (Art. 22, I, Lei 8.212/91)
 * - RAT: 1%, 2%, ou 3% — Risco Ambiental do Trabalho (Art. 22, II)
 * - FAP: Fator Acidentário de Prevenção — multiplicador 0.5 a 2.0 (Art. 10, Lei 10.666/03)
 * - Terceiros (Sistema S): ~5.8% (SESI 1.5%, SENAI 1.0%, INCRA 0.2%, Sal.Educação 2.5%, SEBRAE 0.6%)
 */

export interface EmployerContributionConfig {
  /** RAT: 1, 2, or 3 (%) */
  ratPercent: number;
  /** FAP: 0.500 to 2.000 */
  fapFactor: number;
  /** Terceiros: typically 5.8 (%) */
  terceirosPercent: number;
}

export interface EmployerContributions {
  /** INSS Patronal — 20% sobre o total da remuneração */
  inssPatronal: number;
  /** RAT — Risco Ambiental do Trabalho (ajustado pelo FAP) */
  rat: number;
  /** RAT efetivo = RAT × FAP */
  ratEfetivo: number;
  /** FAP — Fator Acidentário de Prevenção (multiplicador) */
  fap: number;
  /** Terceiros — Sistema S (SESI, SENAI, INCRA, Sal.Educação, SEBRAE) */
  terceiros: number;
  /** Total da contribuição patronal */
  totalPatronal: number;
  /** Base de cálculo (total bruto da folha) */
  baseCalculo: number;
}

/** INSS Patronal rate: 20% */
const INSS_PATRONAL_RATE = 0.2;

/**
 * Calcula as contribuições patronais (GPS) sobre o total bruto da folha.
 *
 * @param totalBrutoFolha Total bruto da remuneração de todos os empregados
 * @param config Configuração de RAT, FAP e Terceiros do tenant
 */
export function calculateEmployerContributions(
  totalBrutoFolha: number,
  config: EmployerContributionConfig,
): EmployerContributions {
  const { ratPercent, fapFactor, terceirosPercent } = config;

  // INSS Patronal: 20% da folha bruta
  const inssPatronal =
    Math.round(totalBrutoFolha * INSS_PATRONAL_RATE * 100) / 100;

  // RAT efetivo = RAT × FAP
  const ratEfetivoPercent = (ratPercent / 100) * fapFactor;
  const ratEfetivo =
    Math.round(totalBrutoFolha * ratEfetivoPercent * 100) / 100;

  // RAT base (sem FAP) para referência
  const rat = Math.round(totalBrutoFolha * (ratPercent / 100) * 100) / 100;

  // Terceiros (Sistema S)
  const terceiros =
    Math.round(totalBrutoFolha * (terceirosPercent / 100) * 100) / 100;

  // Total patronal
  const totalPatronal =
    Math.round((inssPatronal + ratEfetivo + terceiros) * 100) / 100;

  return {
    inssPatronal,
    rat,
    ratEfetivo,
    fap: fapFactor,
    terceiros,
    totalPatronal,
    baseCalculo: totalBrutoFolha,
  };
}
