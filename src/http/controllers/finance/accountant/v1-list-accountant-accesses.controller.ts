import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeListAccountantAccessesUseCase } from '@/use-cases/finance/accountant/factories/make-list-accountant-accesses-use-case';
import type { FastifyInstance } from 'fastify';

export async function listAccountantAccessesController(app: FastifyInstance) {
  app.route({
    method: 'GET',
    url: '/v1/finance/accountant',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.FINANCE.ACCOUNTANT.ACCESS,
        resource: 'accountant',
      }),
    ],
    schema: {
      tags: ['Finance - Accountant Portal'],
      summary: 'List all accountant accesses for the tenant',
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;

      const useCase = makeListAccountantAccessesUseCase();
      const result = await useCase.execute({ tenantId });

      return reply.status(200).send(result);
    },
  });
}
