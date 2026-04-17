import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeApplyEntryRetentionsUseCase } from '@/use-cases/finance/entries/factories/make-apply-entry-retentions-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { ErrorCodes } from '@/@errors/error-codes';
import { errorResponseSchema } from '@/http/schemas/common/error-response.schema';

const retentionConfigSchema = z.object({
  applyIRRF: z.boolean().optional(),
  applyISS: z.boolean().optional(),
  applyINSS: z.boolean().optional(),
  applyPIS: z.boolean().optional(),
  applyCOFINS: z.boolean().optional(),
  applyCSLL: z.boolean().optional(),
  issRate: z.number().min(0).max(1).optional(),
  taxRegime: z.enum(['CUMULATIVO', 'NAO_CUMULATIVO']).optional(),
});

const retentionRecordSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  entryId: z.string(),
  taxType: z.string(),
  grossAmount: z.number(),
  rate: z.number(),
  amount: z.number(),
  withheld: z.boolean(),
  description: z.string().nullable(),
  createdAt: z.coerce.date(),
});

const taxResultSchema = z.object({
  taxType: z.string(),
  grossAmount: z.number(),
  rate: z.number(),
  amount: z.number(),
  description: z.string(),
});

const retentionSummarySchema = z.object({
  retentions: z.array(taxResultSchema),
  totalRetained: z.number(),
  netAmount: z.number(),
});

export async function applyEntryRetentionsController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/finance/entries/:id/retentions/apply',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.FINANCE.ENTRIES.MODIFY,
        resource: 'entries',
      }),
    ],
    schema: {
      tags: ['Finance - Entries'],
      summary: 'Apply tax retentions to a finance entry (persists)',
      security: [{ bearerAuth: [] }],
      params: z.object({ id: z.string().uuid() }),
      body: retentionConfigSchema,
      response: {
        200: z.object({
          summary: retentionSummarySchema,
          retentions: z.array(retentionRecordSchema),
        }),
        404: errorResponseSchema,
      },
    },
    handler: async (request, reply) => {
      const userId = request.user.sub;
      const tenantId = request.user.tenantId!;
      const { id } = request.params as { id: string };
      const config = request.body as z.infer<typeof retentionConfigSchema>;

      try {
        const useCase = makeApplyEntryRetentionsUseCase();
        const result = await useCase.execute({
          tenantId,
          entryId: id,
          config,
          userId,
        });

        return reply.status(200).send(result);
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({
            code: error.code ?? ErrorCodes.RESOURCE_NOT_FOUND,
            message: error.message,
            requestId: request.requestId,
          });
        }
        throw error;
      }
    },
  });
}
