import { z } from 'zod';

/**
 * Phase 06 / Plan 06-06 — Zod schemas do endpoint `GET /v1/hr/compliance/artifacts`.
 *
 * Pattern canônico de listagem paginada no OpenSea:
 *  - `page` default 1, min 1
 *  - `limit` default 50, max 100 (compliance lida com lotes maiores que CRUDs comuns)
 *  - filtros opcionais: type / competencia / periodStart / periodEnd / employeeId
 *  - `search` é campo livre (max 200 char) para filtrar por nome de arquivo etc.
 *
 * Response segue o shape padrão `{ items, meta }` da API.
 */

const COMPETENCIA_REGEX = /^\d{4}-\d{2}$/;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export const listArtifactsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  type: z
    .enum(['AFD', 'AFDT', 'FOLHA_ESPELHO', 'RECIBO', 'S1200_XML'])
    .optional(),
  competencia: z
    .string()
    .regex(COMPETENCIA_REGEX, 'Competência deve estar em formato YYYY-MM')
    .optional(),
  periodStart: z
    .string()
    .regex(DATE_REGEX, 'periodStart deve estar em formato YYYY-MM-DD')
    .optional(),
  periodEnd: z
    .string()
    .regex(DATE_REGEX, 'periodEnd deve estar em formato YYYY-MM-DD')
    .optional(),
  employeeId: z.string().uuid().optional(),
  search: z.string().max(200).optional(),
});

export type ListArtifactsQuery = z.infer<typeof listArtifactsQuerySchema>;

export const artifactDtoSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  type: z.enum(['AFD', 'AFDT', 'FOLHA_ESPELHO', 'RECIBO', 'S1200_XML']),
  periodStart: z.string().nullable(),
  periodEnd: z.string().nullable(),
  competencia: z.string().nullable(),
  filters: z.record(z.string(), z.unknown()).nullable(),
  storageKey: z.string(),
  contentHash: z.string().length(64),
  sizeBytes: z.number().int().nonnegative(),
  generatedBy: z.string(),
  generatedAt: z.string(),
});

export const listArtifactsResponseSchema = z.object({
  items: z.array(artifactDtoSchema),
  meta: z.object({
    page: z.number().int(),
    limit: z.number().int(),
    total: z.number().int(),
    pages: z.number().int(),
  }),
});

export const downloadArtifactParamsSchema = z.object({
  id: z.string().uuid(),
});

export const downloadArtifactResponseSchema = z.object({
  url: z.string().url(),
  expiresAt: z.string(),
});
