import { z } from 'zod';

/**
 * Body do POST /v1/hr/compliance/esocial-s1200.
 *
 * NOTA T-06-05-11: o campo `tpAmb` é DERIVADO EXCLUSIVAMENTE do EsocialConfig
 * do tenant pelo controller. O cliente NÃO pode forçar produção via body — tpAmb
 * está ausente deste schema propositalmente.
 */
export const buildS1200BodySchema = z
  .object({
    competencia: z
      .string()
      .regex(/^\d{4}-\d{2}$/, 'Competência deve estar em formato YYYY-MM'),
    scope: z.enum(['ALL', 'DEPARTMENT', 'CUSTOM']),
    employeeIds: z.array(z.string().uuid()).max(500).optional(),
    departmentIds: z.array(z.string().uuid()).max(100).optional(),
    retify: z
      .object({
        originalReceiptNumber: z.string().min(1).max(128),
        originalEsocialEventId: z.string().uuid(),
      })
      .optional(),
    transmitImmediately: z.boolean().optional().default(false),
  })
  .refine(
    (body) => {
      if (body.scope === 'CUSTOM') {
        return Array.isArray(body.employeeIds) && body.employeeIds.length > 0;
      }
      return true;
    },
    {
      message: 'scope=CUSTOM exige employeeIds (array não vazio)',
      path: ['employeeIds'],
    },
  )
  .refine(
    (body) => {
      if (body.scope === 'DEPARTMENT') {
        return (
          Array.isArray(body.departmentIds) && body.departmentIds.length > 0
        );
      }
      return true;
    },
    {
      message: 'scope=DEPARTMENT exige departmentIds (array não vazio)',
      path: ['departmentIds'],
    },
  );

/**
 * Response 202 — batch criado em DRAFT. Submissão via SOAP fica a cargo do RH
 * (Plan 06-06 UI ou cron futuro).
 */
export const buildS1200ResponseSchema = z.object({
  batchId: z.string().uuid(),
  environment: z.enum(['HOMOLOGACAO', 'PRODUCAO']),
  eventIds: z.array(z.string().uuid()),
  artifactIds: z.array(z.string().uuid()),
  errors: z.array(
    z.object({
      employeeId: z.string(),
      reason: z.string(),
    }),
  ),
  touched: z.array(z.string()).optional(),
});
