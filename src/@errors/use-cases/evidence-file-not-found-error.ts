/**
 * Erro lançado quando um `evidenceFileKey` informado no resolve não existe
 * no bucket S3. Defesa contra phantom keys (client-side tampering):
 * mesmo que o client envie uma storageKey bem-formada, o use case
 * faz `headObject` antes de anexar e recusa se o objeto não está presente.
 *
 * Phase 7 / Plan 07-03 — Warning #7 (S3 headObject validation).
 */
export class EvidenceFileNotFoundError extends Error {
  constructor(key: string) {
    super(`Evidence file not found in storage: ${key}`);
    this.name = 'EvidenceFileNotFoundError';
  }
}
