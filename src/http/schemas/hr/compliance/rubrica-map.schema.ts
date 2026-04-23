import { z } from 'zod';

import { COMPLIANCE_RUBRICA_CONCEPTS } from '@/entities/hr/compliance-rubrica-map';

/**
 * Enum Zod dos conceitos CLT permitidos em `/v1/hr/compliance/esocial-rubricas`.
 * Mantido em sync com `COMPLIANCE_RUBRICA_CONCEPTS` da entity.
 */
export const rubricaConceptSchema = z.enum(COMPLIANCE_RUBRICA_CONCEPTS);

/**
 * Params `{concept}` do endpoint PUT. Restringe a valores válidos para
 * falhar rápido em input malicioso antes de qualquer query.
 */
export const upsertRubricaMapParamsSchema = z.object({
  concept: rubricaConceptSchema,
});

/**
 * Body do PUT. codRubr/ideTabRubr respeitam limites do schema Prisma (16 chars).
 * indApurIR é opcional (0=normal, 1=13o); default do governo é omitir.
 */
export const upsertRubricaMapBodySchema = z.object({
  codRubr: z.string().min(1).max(16),
  ideTabRubr: z.string().min(1).max(16),
  indApurIR: z.number().int().min(0).max(1).optional(),
});

/**
 * Response item na lista — inclui o concept para facilitar UI que agrupa
 * por linha fixa (HE_50/HE_100/DSR + opcionais).
 */
export const rubricaMapItemResponse = z.object({
  id: z.string().uuid(),
  clrConcept: rubricaConceptSchema,
  codRubr: z.string(),
  ideTabRubr: z.string(),
  indApurIR: z.number().int().nullable(),
  updatedBy: z.string().uuid(),
  updatedAt: z.string(),
});

/**
 * Response do GET — items ordenados por concept + array `gaps` com conceitos
 * obrigatórios (HE_50, HE_100, DSR) ainda não mapeados.
 */
export const listRubricaMapResponse = z.object({
  items: z.array(rubricaMapItemResponse),
  gaps: z.array(rubricaConceptSchema),
});

/**
 * Response do PUT — retorna o item atualizado + flag `created` para a UI
 * distinguir 201 vs 200.
 */
export const upsertRubricaMapResponse = rubricaMapItemResponse.extend({
  created: z.boolean(),
});
