import type { AfdBuildInput } from './afd-builder';
import { buildAfd } from './afd-builder';

/**
 * AFDT é artefato proprietário OpenSea que agrega batidas originais + correções
 * aprovadas (PunchApproval com correctionPayload). NÃO é o leiaute oficial AEJ
 * da Portaria MTP 671/2021 — o artefato legal exigido em auditoria é o AFD.
 *
 * Achado da pesquisa (06-RESEARCH.md §AFDT Framing): a Portaria MTP 671/2021
 * substituiu formalmente o AFDT pelo AEJ (Arquivo Eletrônico de Jornada). O
 * sucesso critério #2 do ROADMAP ("RH gera AFDT consolidado...") é entregue
 * como produto proprietário (D-05 ratificado pelo usuário): mesmo layout do
 * AFD + linhas de batidas corrigidas (`adjustmentType='ADJUSTMENT_APPROVED'`)
 * incluídas como registros tipo 7 normais com NSR sequencial próprio.
 *
 * Rastreabilidade de "esta linha é ajuste de qual batida" fica no DB
 * (`TimeEntry.originNsrNumber`), NÃO no arquivo (o layout AFD não tem campo
 * para referenciar NSR original).
 *
 * Dashboard `/hr/compliance` (Plan 06-06) exibe tooltip/legenda explícita:
 * "AFDT é agregação interna para conferência trabalhista; AFD é o artefato
 * legal exigido pela Portaria MTP 671/2021."
 */
export function buildAfdt(input: AfdBuildInput): Buffer {
  return buildAfd(input, { includeAdjustments: true });
}
