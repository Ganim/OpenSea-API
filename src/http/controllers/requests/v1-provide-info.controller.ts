import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { logAudit } from '@/http/helpers/audit.helper';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { makeGetUserByIdUseCase } from '@/use-cases/core/users/factories/make-get-user-by-id-use-case';
import { makeProvideInfoUseCase } from '@/use-cases/requests/factories/make-provide-info-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function provideInfoController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PATCH',
    url: '/v1/requests/:id/provide-info',
    preHandler: [verifyJwt],
    schema: {
      tags: ['Core - Requests'],
      summary: 'Provide requested information',
      params: z.object({
        id: z.string().uuid(),
      }),
      body: z.object({
        informationProvided: z.string().min(10),
      }),
      response: {
        200: z.object({ success: z.boolean() }),
        400: z.object({ message: z.string() }),
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

      const useCase = makeProvideInfoUseCase();

      await useCase.execute({
        requestId: request.params.id,
        providedById: userId,
        informationProvided: request.body.informationProvided,
      });

      await logAudit(request, {
        message: AUDIT_MESSAGES.REQUESTS.REQUEST_INFO_PROVIDE,
        entityId: request.params.id,
        placeholders: {
          userName,
          requestNumber: request.params.id,
        },
        newData: { informationProvided: request.body.informationProvided },
      });

      return reply.status(200).send({ success: true });
    },
  });
}
