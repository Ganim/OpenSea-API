import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeGetUserByIdUseCase } from '@/use-cases/core/users/factories/make-get-user-by-id-use-case';
import { makeDeleteManufacturerUseCase } from '@/use-cases/stock/manufacturers/factories/make-delete-manufacturer-use-case';
import { makeGetManufacturerByIdUseCase } from '@/use-cases/stock/manufacturers/factories/make-get-manufacturer-by-id-use-case';

export async function deleteManufacturerController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'DELETE',
    url: '/v1/manufacturers/:id',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.STOCK.MANUFACTURERS.DELETE,
        resource: 'manufacturers',
      }),
    ],
    schema: {
      tags: ['Stock - Manufacturers'],
      summary: 'Delete a manufacturer',
      params: z.object({
        id: z.uuid(),
      }),
      response: {
        204: z.void(),
        404: z.object({
          message: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const { id } = request.params as { id: string };
      const userId = request.user.sub;
      const tenantId = request.user.tenantId!;

      try {
        const getUserByIdUseCase = makeGetUserByIdUseCase();
        const getManufacturerByIdUseCase = makeGetManufacturerByIdUseCase();

        const [{ user }, { manufacturer }] = await Promise.all([
          getUserByIdUseCase.execute({ userId }),
          getManufacturerByIdUseCase.execute({ tenantId, id }),
        ]);
        const userName = user.profile?.name
          ? `${user.profile.name} ${user.profile.surname || ''}`.trim()
          : user.username || user.email;

        const useCase = makeDeleteManufacturerUseCase();
        await useCase.execute({ tenantId, id });

        await logAudit(request, {
          message: AUDIT_MESSAGES.STOCK.MANUFACTURER_DELETE,
          entityId: id,
          placeholders: { userName, manufacturerName: manufacturer.name },
          oldData: { id: manufacturer.id.toString(), name: manufacturer.name },
        });

        return reply.status(204).send();
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }

        throw error;
      }
    },
  });
}
