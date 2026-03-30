import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeGenerateTaxObligationsUseCase } from '@/use-cases/finance/compliance/factories/make-generate-tax-obligations-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

const generateTaxObligationsBodySchema = z.object({
  year: z.number().int().min(2000).max(2100),
  month: z.number().int().min(1).max(12),
});

export async function generateTaxObligationsController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/finance/compliance/tax-obligations/generate',
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
        'Auto-generate tax obligations (DARFs) from retention records for a given month',
      security: [{ bearerAuth: [] }],
      body: generateTaxObligationsBodySchema,
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const body = request.body as { year: number; month: number };

      const useCase = makeGenerateTaxObligationsUseCase();
      const { created, skipped } = await useCase.execute({
        tenantId,
        year: body.year,
        month: body.month,
      });

      const formattedObligations = created.map((obligation) => ({
        id: obligation.id.toString(),
        taxType: obligation.taxType,
        referenceMonth: obligation.referenceMonth,
        referenceYear: obligation.referenceYear,
        dueDate: obligation.dueDate.toISOString(),
        amount: obligation.amount,
        status: obligation.status,
        darfCode: obligation.darfCode ?? null,
      }));

      return reply.status(201).send({
        created: formattedObligations,
        skipped,
      });
    },
  });
}
