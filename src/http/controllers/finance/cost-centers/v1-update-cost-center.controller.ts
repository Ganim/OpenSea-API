import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  updateCostCenterSchema,
  costCenterResponseSchema,
} from '@/http/schemas/finance';
import { makeGetUserByIdUseCase } from '@/use-cases/core/users/factories/make-get-user-by-id-use-case';
import { makeGetCostCenterByIdUseCase } from '@/use-cases/finance/cost-centers/factories/make-get-cost-center-by-id-use-case';
import { makeUpdateCostCenterUseCase } from '@/use-cases/finance/cost-centers/factories/make-update-cost-center-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function updateCostCenterController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PATCH',
    url: '/v1/finance/cost-centers/:id',
    onRequest: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.FINANCE.COST_CENTERS.UPDATE,
        resource: 'cost-centers',
      }),
    ],
    schema: {
      tags: ['Finance - Cost Centers'],
      summary: 'Update a cost center',
      security: [{ bearerAuth: [] }],
      params: z.object({ id: z.string().uuid() }),
      body: updateCostCenterSchema,
      response: {
        200: z.object({ costCenter: costCenterResponseSchema }),
        400: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
    },
    handler: async (request, reply) => {
      const userId = request.user.sub;
      const tenantId = request.user.tenantId!;
      const { id } = request.params as { id: string };

      try {
        const [{ user }, oldData] = await Promise.all([
          makeGetUserByIdUseCase().execute({ userId }),
          makeGetCostCenterByIdUseCase().execute({ tenantId, id }),
        ]);
        const userName = user.profile?.name
          ? `${user.profile.name} ${user.profile.surname || ''}`.trim()
          : user.username || user.email;

        const useCase = makeUpdateCostCenterUseCase();
        const result = await useCase.execute({ tenantId, id, ...request.body });

        await logAudit(request, {
          message: AUDIT_MESSAGES.FINANCE.COST_CENTER_UPDATE,
          entityId: id,
          placeholders: { userName, costCenterName: result.costCenter.name },
          oldData: { ...oldData.costCenter },
          newData: request.body,
        });

        return reply.status(200).send(result);
      } catch (error) {
        if (error instanceof BadRequestError) {
          return reply.status(400).send({ message: error.message });
        }
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
