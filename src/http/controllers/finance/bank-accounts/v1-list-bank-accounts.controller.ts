import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { bankAccountResponseSchema } from '@/http/schemas/finance';
import { makeListBankAccountsUseCase } from '@/use-cases/finance/bank-accounts/factories/make-list-bank-accounts-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  search: z.string().optional(),
  companyId: z.string().uuid().optional(),
  accountType: z
    .enum(['CHECKING', 'SAVINGS', 'INVESTMENT', 'SALARY', 'DIGITAL', 'OTHER'])
    .optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED', 'CLOSED']).optional(),
  sortBy: z.enum(['name', 'bankName', 'createdAt']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export async function listBankAccountsController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/finance/bank-accounts',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.FINANCE.BANK_ACCOUNTS.ACCESS,
        resource: 'bank-accounts',
      }),
    ],
    schema: {
      tags: ['Finance - Bank Accounts'],
      summary: 'List bank accounts',
      security: [{ bearerAuth: [] }],
      querystring: listQuerySchema,
      response: {
        // P1-43: standardized `{ data, meta }` shape shared by every
        // paginated finance list. `bankAccounts` kept as a transitional
        // alias so older frontend bundles that still read it stay working
        // until the migration on the APP side is confirmed in production.
        200: z.object({
          data: z.array(bankAccountResponseSchema),
          bankAccounts: z.array(bankAccountResponseSchema),
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
      const {
        page,
        limit,
        search,
        companyId,
        accountType,
        status,
        sortBy,
        sortOrder,
      } = request.query;

      const useCase = makeListBankAccountsUseCase();
      const result = await useCase.execute({
        tenantId,
        page,
        limit,
        search,
        companyId,
        accountType,
        status,
        sortBy,
        sortOrder,
      });

      reply.header('Cache-Control', 'private, max-age=300');
      // P1-43: serve both the new `data` key and the legacy `bankAccounts`
      // key from the same payload; frontend will flip to `data`.
      return reply.status(200).send({
        data: result.bankAccounts,
        bankAccounts: result.bankAccounts,
        meta: result.meta,
      });
    },
  });
}
