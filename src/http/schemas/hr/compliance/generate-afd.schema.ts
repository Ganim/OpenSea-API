import { z } from 'zod';

/**
 * Phase 06 / Plan 06-02 — Zod schemas do endpoint `POST /v1/hr/compliance/afd`.
 *
 * Regras (D-02 / CONTEXT):
 *  - `startDate` / `endDate` obrigatórios em AAAA-MM-DD.
 *  - `cnpj` opcional (14 dígitos, sem pontuação — filtro opcional por filial).
 *  - `departmentIds` opcional (lista de UUIDs, máx 50 — anti-abuse contra SQL
 *    builder muito pesado).
 *  - Janela: `endDate - startDate` ∈ [0, 365] dias. Fora disso, retorna 400.
 *  - Período invertido (endDate < startDate) também rejeitado.
 *
 * O mesmo body schema serve para AFD e AFDT (endpoints distintos por permissão).
 * O schema de resposta inclui apenas campos não-sensíveis — NSR, CPF e PII
 * ficam dentro do blob R2 baixado via `downloadUrl` presigned (TTL 15min).
 */

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Body do endpoint de geração. Aceita também filtro `employeeId` (opcional,
 * UUID) para geração por funcionário — útil em auditorias pontuais.
 */
export const generateAfdBodySchema = z
  .object({
    startDate: z
      .string()
      .regex(DATE_REGEX, 'Use AAAA-MM-DD')
      .describe('Início da janela (inclusivo), formato AAAA-MM-DD'),
    endDate: z
      .string()
      .regex(DATE_REGEX, 'Use AAAA-MM-DD')
      .describe('Fim da janela (inclusivo), formato AAAA-MM-DD'),
    cnpj: z
      .string()
      .regex(/^\d{14}$/, 'Informe 14 dígitos do CNPJ sem pontuação')
      .optional()
      .describe('Filtro opcional por CNPJ de filial (14 dígitos numéricos)'),
    departmentIds: z
      .array(z.string().uuid())
      .max(50, 'Máximo 50 departamentos por chamada')
      .optional()
      .describe('Filtro opcional por departamentos (lista de UUIDs)'),
    employeeId: z
      .string()
      .uuid()
      .optional()
      .describe('Filtro opcional por funcionário (UUID)'),
  })
  .refine(
    ({ startDate, endDate }) => {
      const start = new Date(startDate).getTime();
      const end = new Date(endDate).getTime();
      if (Number.isNaN(start) || Number.isNaN(end)) return false;
      const diffDays = (end - start) / 86400000;
      return diffDays >= 0 && diffDays <= 365;
    },
    {
      message: 'Período deve ser entre 0 e 365 dias (endDate >= startDate)',
      path: ['endDate'],
    },
  );

export type GenerateAfdBody = z.infer<typeof generateAfdBodySchema>;

/**
 * Resposta padrão: metadata do artefato + URL presigned para download.
 * Nada de CPF, NSR, razão social cru — PII fica apenas no arquivo.
 */
export const generateArtifactResponseSchema = z.object({
  artifactId: z
    .string()
    .uuid()
    .describe('ID do ComplianceArtifact recém-criado'),
  downloadUrl: z
    .string()
    .url()
    .describe('URL presigned (TTL 15min) para baixar o AFD do R2'),
  storageKey: z
    .string()
    .describe(
      'Chave determinística no R2 — também gravada em ComplianceArtifact.storageKey',
    ),
  sizeBytes: z
    .number()
    .int()
    .positive()
    .describe('Tamanho do arquivo em bytes'),
  contentHash: z
    .string()
    .length(64)
    .describe(
      'SHA-256 hex do conteúdo — auditor pode comparar com hash impresso',
    ),
});

export type GenerateArtifactResponse = z.infer<
  typeof generateArtifactResponseSchema
>;
