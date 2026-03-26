import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeListEntryRetentionsUseCase } from '@/use-cases/finance/entries/factories/make-list-entry-retentions-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

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

export async function listEntryRetentionsController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/finance/entries/:id/retentions',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.FINANCE.ENTRIES.ACCESS,
        resource: 'entries',
      }),
    ],
    schema: {
      tags: ['Finance - Entries'],
      summary: 'List tax retentions for a finance entry',
      security: [{ bearerAuth: [] }],
      params: z.object({ id: z.string().uuid() }),
      response: {
        200: z.object({
          retentions: z.array(retentionRecordSchema),
          totalRetained: z.number(),
        }),
      },
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { id } = request.params as { id: string };

      const useCase = makeListEntryRetentionsUseCase();
      const result = await useCase.execute({
        tenantId,
        entryId: id,
      });

      return reply.status(200).send(result);
    },
  });
}
