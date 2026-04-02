import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { ledgerQuerySchema } from '@/http/schemas/finance';
import { makeGetLedgerUseCase } from '@/use-cases/finance/journal-entries/factories/make-get-ledger-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

const ledgerEntrySchema = z.object({
  date: z.coerce.date(),
  journalEntryId: z.string().uuid(),
  journalCode: z.string(),
  description: z.string(),
  debit: z.number(),
  credit: z.number(),
  balance: z.number(),
  sourceType: z.string(),
  sourceId: z.string().nullable(),
});

const accountInfoSchema = z.object({
  id: z.string().uuid(),
  code: z.string(),
  name: z.string(),
  type: z.string(),
  nature: z.string(),
});

export async function getLedgerController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/finance/reports/ledger',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.FINANCE.REPORTS.ACCESS,
        resource: 'reports',
      }),
    ],
    schema: {
      tags: ['Finance - Reports'],
      summary: 'Get account ledger (Razão)',
      security: [{ bearerAuth: [] }],
      querystring: ledgerQuerySchema,
      response: {
        200: z.object({
          account: accountInfoSchema,
          period: z.object({ from: z.coerce.date(), to: z.coerce.date() }),
          openingBalance: z.number(),
          entries: z.array(ledgerEntrySchema),
          closingBalance: z.number(),
          totalDebits: z.number(),
          totalCredits: z.number(),
        }),
        404: z.object({ message: z.string() }),
      },
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { chartOfAccountId, from, to } = request.query;

      try {
        const useCase = makeGetLedgerUseCase();
        const result = await useCase.execute({
          tenantId,
          chartOfAccountId,
          from,
          to,
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
