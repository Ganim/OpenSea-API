import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  createCostCenterSchema,
  costCenterResponseSchema,
} from '@/http/schemas/finance';
import { makeGetUserByIdUseCase } from '@/use-cases/core/users/factories/make-get-user-by-id-use-case';
import { makeCreateCostCenterUseCase } from '@/use-cases/finance/cost-centers/factories/make-create-cost-center-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function createCostCenterController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/finance/cost-centers',
    onRequest: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.FINANCE.COST_CENTERS.CREATE,
        resource: 'cost-centers',
      }),
    ],
    schema: {
      tags: ['Finance - Cost Centers'],
      summary: 'Create a new cost center',
      security: [{ bearerAuth: [] }],
      body: createCostCenterSchema,
      response: {
        201: z.object({ costCenter: costCenterResponseSchema }),
        400: z.object({ message: z.string() }),
      },
    },
    handler: async (request, reply) => {
      const userId = request.user.sub;
      const tenantId = request.user.tenantId!;

      try {
        const getUserByIdUseCase = makeGetUserByIdUseCase();
        const { user } = await getUserByIdUseCase.execute({ userId });
        const userName = user.profile?.name
          ? `${user.profile.name} ${user.profile.surname || ''}`.trim()
          : user.username || user.email;

        const useCase = makeCreateCostCenterUseCase();
        const result = await useCase.execute({ tenantId, ...request.body });

        await logAudit(request, {
          message: AUDIT_MESSAGES.FINANCE.COST_CENTER_CREATE,
          entityId: result.costCenter.id,
          placeholders: { userName, costCenterName: result.costCenter.name },
          newData: request.body,
        });

        return reply.status(201).send(result);
      } catch (error) {
        if (error instanceof BadRequestError) {
          return reply.status(400).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
