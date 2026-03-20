import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeExpireVacationPeriodsUseCase } from '@/use-cases/hr/vacation-periods/factories/make-expire-vacation-periods-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function v1ExpireVacationPeriodsController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/hr/vacation-periods/expire',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.HR.VACATIONS.ADMIN,
        resource: 'vacation-periods',
      }),
    ],
    schema: {
      tags: ['HR - Vacation Periods'],
      summary: 'Expire overdue vacation periods',
      description:
        'Marks vacation periods as expired when concession period has passed',
      response: {
        200: z.object({
          expiredCount: z.number(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;

      const useCase = makeExpireVacationPeriodsUseCase();
      const result = await useCase.execute({ tenantId });

      return reply.status(200).send(result);
    },
  });
}
