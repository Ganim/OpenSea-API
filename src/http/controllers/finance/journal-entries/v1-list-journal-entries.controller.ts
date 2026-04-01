import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { journalEntryResponseSchema, listJournalEntriesSchema } from '@/http/schemas/finance';
import { makeListJournalEntriesUseCase } from '@/use-cases/finance/journal-entries/factories/make-list-journal-entries-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function listJournalEntriesController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/finance/journal-entries',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.FINANCE.JOURNAL_ENTRIES.ACCESS,
        resource: 'journal-entries',
      }),
    ],
    schema: {
      tags: ['Finance - Journal Entries'],
      summary: 'List journal entries (paginated)',
      security: [{ bearerAuth: [] }],
      querystring: listJournalEntriesSchema,
      response: {
        200: z.object({
          entries: z.array(journalEntryResponseSchema),
          meta: z.object({
            total: z.number(),
            page: z.number(),
            limit: z.number(),
            pages: z.number(),
          }),
        }),
      },
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { page, limit, chartOfAccountId, sourceType, dateFrom, dateTo } = request.query;

      const useCase = makeListJournalEntriesUseCase();
      const result = await useCase.execute({
        tenantId,
        page,
        limit,
        chartOfAccountId,
        sourceType,
        dateFrom,
        dateTo,
      });

      return reply.status(200).send(result);
    },
  });
}
