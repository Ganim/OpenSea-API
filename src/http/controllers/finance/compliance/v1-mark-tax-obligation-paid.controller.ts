import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeMarkTaxObligationPaidUseCase } from '@/use-cases/finance/compliance/factories/make-mark-tax-obligation-paid-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

const markPaidParamsSchema = z.object({
  id: z.string().uuid(),
});

const markPaidBodySchema = z.object({
  paidAt: z.coerce.date(),
  entryId: z.string().uuid().optional(),
});

export async function markTaxObligationPaidController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PATCH',
    url: '/v1/finance/compliance/tax-obligations/:id/pay',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.FINANCE.COMPLIANCE.MODIFY,
        resource: 'compliance',
      }),
    ],
    schema: {
      tags: ['Finance - Compliance'],
      summary:
        'Mark a tax obligation as paid and optionally link to a finance entry',
      security: [{ bearerAuth: [] }],
      params: markPaidParamsSchema,
      body: markPaidBodySchema,
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const params = request.params as { id: string };
      const body = request.body as { paidAt: Date; entryId?: string };

      const useCase = makeMarkTaxObligationPaidUseCase();
      const { obligation } = await useCase.execute({
        tenantId,
        obligationId: params.id,
        paidAt: body.paidAt,
        entryId: body.entryId,
      });

      return reply.status(200).send({
        id: obligation.id.toString(),
        taxType: obligation.taxType,
        referenceMonth: obligation.referenceMonth,
        referenceYear: obligation.referenceYear,
        dueDate: obligation.dueDate.toISOString(),
        amount: obligation.amount,
        status: obligation.status,
        paidAt: obligation.paidAt?.toISOString() ?? null,
        darfCode: obligation.darfCode ?? null,
        entryId: obligation.entryId ?? null,
      });
    },
  });
}
