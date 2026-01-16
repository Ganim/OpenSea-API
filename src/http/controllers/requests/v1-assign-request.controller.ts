import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { makeGetUserByIdUseCase } from '@/use-cases/core/users/factories/make-get-user-by-id-use-case';
import { makeAssignRequestUseCase } from '@/use-cases/requests/factories/make-assign-request-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function assignRequestController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PATCH',
    url: '/v1/requests/:id/assign',
    preHandler: [
      verifyJwt,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.REQUESTS.REQUESTS.ASSIGN,
        resource: 'requests',
      }),
    ],
    schema: {
      tags: ['Core - Requests'],
      summary: 'Assign request to a user',
      params: z.object({
        id: z.string().uuid(),
      }),
      body: z.object({
        assignedToId: z.string().uuid(),
      }),
      response: {
        200: z.object({ success: z.boolean() }),
        403: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const userId = request.user.sub;

      const getUserByIdUseCase = makeGetUserByIdUseCase();
      const [{ user: admin }, { user: assignee }] = await Promise.all([
        getUserByIdUseCase.execute({ userId }),
        getUserByIdUseCase.execute({ userId: request.body.assignedToId }),
      ]);
      const adminName = admin.profile?.name
        ? `${admin.profile.name} ${admin.profile.surname || ''}`.trim()
        : admin.username || admin.email;
      const assigneeName = assignee.profile?.name
        ? `${assignee.profile.name} ${assignee.profile.surname || ''}`.trim()
        : assignee.username || assignee.email;

      const useCase = makeAssignRequestUseCase();

      await useCase.execute({
        requestId: request.params.id,
        assignedToId: request.body.assignedToId,
        performedById: userId,
        hasAssignPermission: true, // Middleware already verified permission
      });

      await logAudit(request, {
        message: AUDIT_MESSAGES.REQUESTS.REQUEST_ASSIGN,
        entityId: request.params.id,
        placeholders: {
          adminName,
          requestNumber: request.params.id,
          assigneeName,
        },
        newData: { assignedToId: request.body.assignedToId },
      });

      return reply.status(200).send({ success: true });
    },
  });
}
