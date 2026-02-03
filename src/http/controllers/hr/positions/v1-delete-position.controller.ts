import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeGetUserByIdUseCase } from '@/use-cases/core/users/factories/make-get-user-by-id-use-case';
import {
  makeDeletePositionUseCase,
  makeGetPositionByIdUseCase,
} from '@/use-cases/hr/positions/factories';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

const paramsSchema = z.object({
  id: z.string().uuid('Invalid position ID format'),
});

const responseSchema = z.object({
  message: z.string(),
});

export async function deletePositionController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'DELETE',
    url: '/v1/hr/positions/:id',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.HR.POSITIONS.DELETE,
        resource: 'positions',
      }),
    ],
    schema: {
      tags: ['HR - Positions'],
      summary: 'Delete a position',
      description: 'Deletes a position from the system',
      params: paramsSchema,
      response: {
        200: responseSchema,
        400: z.object({
          message: z.string(),
        }),
        404: z.object({
          message: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { id } = request.params;
      const userId = request.user.sub;

      try {
        const getUserByIdUseCase = makeGetUserByIdUseCase();
        const getPositionByIdUseCase = makeGetPositionByIdUseCase();

        const [{ user }, { position }] = await Promise.all([
          getUserByIdUseCase.execute({ userId }),
          getPositionByIdUseCase.execute({ tenantId, id }),
        ]);
        const userName = user.profile?.name
          ? `${user.profile.name} ${user.profile.surname || ''}`.trim()
          : user.username || user.email;

        const deletePositionUseCase = makeDeletePositionUseCase();
        await deletePositionUseCase.execute({ tenantId, id });

        await logAudit(request, {
          message: AUDIT_MESSAGES.HR.POSITION_DELETE,
          entityId: id,
          placeholders: { userName, positionName: position.name },
          oldData: { id: position.id, name: position.name },
        });

        return reply.status(200).send({
          message: 'Position deleted successfully',
        });
      } catch (error) {
        if (error instanceof Error) {
          if (error.message === 'Position not found') {
            return reply.status(404).send({ message: error.message });
          }
          if (error.message === 'Cannot delete position with employees') {
            return reply.status(400).send({ message: error.message });
          }
          return reply.status(400).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
