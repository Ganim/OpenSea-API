import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { logAudit } from '@/http/helpers/audit.helper';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { makeGetUserByIdUseCase } from '@/use-cases/core/users/factories/make-get-user-by-id-use-case';
import { makeCompleteRequestUseCase } from '@/use-cases/requests/factories/make-complete-request-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function completeRequestController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PATCH',
    url: '/v1/requests/:id/complete',
    preHandler: [verifyJwt],
    schema: {
      tags: ['Core - Requests'],
      summary: 'Complete a request',
      params: z.object({
        id: z.string().uuid(),
      }),
      body: z.object({
        completionNotes: z.string().optional(),
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
      const { user } = await getUserByIdUseCase.execute({ userId });
      const userName = user.profile?.name
        ? `${user.profile.name} ${user.profile.surname || ''}`.trim()
        : user.username || user.email;

      const useCase = makeCompleteRequestUseCase();

      await useCase.execute({
        requestId: request.params.id,
        completedById: userId,
        completionNotes: request.body.completionNotes,
      });

      await logAudit(request, {
        message: AUDIT_MESSAGES.REQUESTS.REQUEST_COMPLETE,
        entityId: request.params.id,
        placeholders: {
          userName,
          requestNumber: request.params.id,
        },
        newData: { completionNotes: request.body.completionNotes },
      });

      return reply.status(200).send({ success: true });
    },
  });
}
