import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeCalculateEntryRetentionsUseCase } from '@/use-cases/finance/entries/factories/make-calculate-entry-retentions-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

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

export async function calculateEntryRetentionsController(
  app: FastifyInstance,
) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/finance/entries/:id/retentions/calculate',
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
      summary: 'Calculate tax retentions for a finance entry (dry-run)',
      security: [{ bearerAuth: [] }],
      params: z.object({ id: z.string().uuid() }),
      body: retentionConfigSchema,
      response: {
        200: z.object({ summary: retentionSummarySchema }),
        404: z.object({ message: z.string() }),
      },
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { id } = request.params as { id: string };
      const config = request.body as z.infer<typeof retentionConfigSchema>;

      try {
        const useCase = makeCalculateEntryRetentionsUseCase();
        const result = await useCase.execute({
          tenantId,
          entryId: id,
          config,
        });

        return reply.status(200).send(result);
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
