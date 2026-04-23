/**
 * Phase 06 / Plan 06-02 — Schema do endpoint `POST /v1/hr/compliance/afdt`.
 *
 * AFDT é o artefato proprietário OpenSea (D-05 / ratificado pelo usuário):
 * mesmo layout do AFD oficial, mas inclui também as batidas de correção
 * (`adjustmentType=ADJUSTMENT_APPROVED`). NÃO é o leiaute AEJ — o artefato
 * legal exigido em auditoria é o AFD.
 *
 * Body schema é idêntico ao AFD — re-exportamos para manter os dois endpoints
 * alinhados. Se no futuro o AFDT precisar de parâmetros próprios (ex: opção
 * "incluir notas do gestor no comentário"), quebrar em schema dedicado aqui.
 */

export {
  generateAfdBodySchema as generateAfdtBodySchema,
  generateArtifactResponseSchema,
} from './generate-afd.schema';

export type {
  GenerateAfdBody as GenerateAfdtBody,
  GenerateArtifactResponse,
} from './generate-afd.schema';
