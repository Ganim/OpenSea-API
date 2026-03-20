import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { recurringConfigIdParamSchema } from '@/http/schemas/finance/recurring/recurring-config.schema';
import { recurringConfigToDTO } from '@/mappers/finance/recurring-config/recurring-config-to-dto';
import { PrismaRecurringConfigsRepository } from '@/repositories/finance/prisma/prisma-recurring-configs-repository';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';

export async function getRecurringConfigController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/finance/recurring/:id',
    onRequest: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.FINANCE.RECURRING.ACCESS,
        resource: 'recurring',
      }),
    ],
    schema: {
      tags: ['Finance - Recurring'],
      summary: 'Get a recurring config by ID',
      security: [{ bearerAuth: [] }],
      params: recurringConfigIdParamSchema,
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { id } = request.params as { id: string };

      const repository = new PrismaRecurringConfigsRepository();
      const config = await repository.findById(id, tenantId);

      if (!config) {
        throw new ResourceNotFoundError('Recurring config not found');
      }

      reply.header('Cache-Control', 'private, max-age=60');
      return reply.status(200).send(recurringConfigToDTO(config));
    },
  });
}
