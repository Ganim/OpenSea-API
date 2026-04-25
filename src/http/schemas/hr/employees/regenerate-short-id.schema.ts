/**
 * HR Employee — Regenerate Short ID Schemas
 *
 * Schemas para o endpoint de regeneração do shortId público do funcionário,
 * usado no fluxo de login do operador no PDV Emporion.
 */

import { z } from 'zod';
import { idSchema } from '../../common.schema';
import { employeeResponseSchema } from './employee.schema';

/**
 * Schema de params: identificador do funcionário cujo shortId será rotacionado.
 */
export const regenerateEmployeeShortIdParamsSchema = z.object({
  employeeId: idSchema,
});

/**
 * Schema de resposta: funcionário atualizado + shortId anterior (para auditoria/UX).
 */
export const regenerateEmployeeShortIdResponseSchema = z.object({
  employee: employeeResponseSchema,
  previousShortId: z.string().nullable(),
});

export type RegenerateEmployeeShortIdParams = z.infer<
  typeof regenerateEmployeeShortIdParamsSchema
>;
export type RegenerateEmployeeShortIdResponse = z.infer<
  typeof regenerateEmployeeShortIdResponseSchema
>;
