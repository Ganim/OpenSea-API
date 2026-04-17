import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeGetUserByIdUseCase } from '@/use-cases/core/users/factories/make-get-user-by-id-use-case';
import { makeGetConsortiumByIdUseCase } from '@/use-cases/finance/consortia/factories/make-get-consortium-by-id-use-case';
import { makeDeleteConsortiumUseCase } from '@/use-cases/finance/consortia/factories/make-delete-consortium-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { ErrorCodes } from '@/@errors/error-codes';
import { errorResponseSchema } from '@/http/schemas/common/error-response.schema';

export async function deleteConsortiumController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'DELETE',
    url: '/v1/finance/consortia/:id',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.FINANCE.CONSORTIA.REMOVE,
        resource: 'consortia',
      }),
    ],
    schema: {
      tags: ['Finance - Consortia'],
      summary: 'Delete a consortium',
      security: [{ bearerAuth: [] }],
      params: z.object({ id: z.string().uuid() }),
      response: {
        204: z.null(),
        404: errorResponseSchema,
      },
    },
    handler: async (request, reply) => {
      const userId = request.user.sub;
      const tenantId = request.user.tenantId!;
      const { id } = request.params as { id: string };

      try {
        const [{ user }, oldData] = await Promise.all([
          makeGetUserByIdUseCase().execute({ userId }),
          makeGetConsortiumByIdUseCase().execute({ tenantId, id }),
        ]);
        const userName = user.profile?.name
          ? `${user.profile.name} ${user.profile.surname || ''}`.trim()
          : user.username || user.email;

        const useCase = makeDeleteConsortiumUseCase();
        await useCase.execute({ tenantId, id });

        await logAudit(request, {
          message: AUDIT_MESSAGES.FINANCE.CONSORTIUM_DELETE,
          entityId: id,
          placeholders: { userName, consortiumName: oldData.consortium.name },
          oldData: { ...oldData.consortium },
        });

        return reply.status(204).send(null);
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({
            code: error.code ?? ErrorCodes.RESOURCE_NOT_FOUND,
            message: error.message,
            requestId: request.requestId,
          });
        }
        throw error;
      }
    },
  });
}
