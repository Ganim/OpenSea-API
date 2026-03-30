import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeListTaxObligationsUseCase } from '@/use-cases/finance/compliance/factories/make-list-tax-obligations-use-case';
import type {
  TaxObligationStatus,
  TaxType,
} from '@/entities/finance/tax-obligation';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

const taxCalendarQuerySchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100).optional(),
  month: z.coerce.number().int().min(1).max(12).optional(),
  status: z.enum(['PENDING', 'PAID', 'OVERDUE', 'CANCELLED']).optional(),
  taxType: z.enum(['IRRF', 'ISS', 'INSS', 'PIS', 'COFINS', 'CSLL']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export async function listTaxObligationsController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/finance/compliance/tax-calendar',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.FINANCE.COMPLIANCE.ACCESS,
        resource: 'compliance',
      }),
    ],
    schema: {
      tags: ['Finance - Compliance'],
      summary: 'List tax obligations (DARF calendar) with filters',
      security: [{ bearerAuth: [] }],
      querystring: taxCalendarQuerySchema,
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const query = request.query as {
        year?: number;
        month?: number;
        status?: TaxObligationStatus;
        taxType?: TaxType;
        page: number;
        limit: number;
      };

      const useCase = makeListTaxObligationsUseCase();
      const { obligations, total } = await useCase.execute({
        tenantId,
        year: query.year,
        month: query.month,
        status: query.status,
        taxType: query.taxType,
        page: query.page,
        limit: query.limit,
      });

      const formattedObligations = obligations.map((obligation) => ({
        id: obligation.id.toString(),
        taxType: obligation.taxType,
        referenceMonth: obligation.referenceMonth,
        referenceYear: obligation.referenceYear,
        referencePeriod: obligation.referencePeriod,
        dueDate: obligation.dueDate.toISOString(),
        amount: obligation.amount,
        status: obligation.status,
        paidAt: obligation.paidAt?.toISOString() ?? null,
        darfCode: obligation.darfCode ?? null,
        entryId: obligation.entryId ?? null,
        isOverdue: obligation.isOverdue,
        createdAt: obligation.createdAt.toISOString(),
      }));

      return reply.status(200).send({
        data: formattedObligations,
        meta: {
          total,
          page: query.page,
          limit: query.limit,
          pages: Math.ceil(total / query.limit),
        },
      });
    },
  });
}
