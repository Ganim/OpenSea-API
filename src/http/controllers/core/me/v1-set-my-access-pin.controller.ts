import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { logAudit } from '@/http/helpers/audit.helper';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { setAccessPinBodySchema, userResponseSchema } from '@/http/schemas';
import { makeSetAccessPinUseCase } from '@/use-cases/core/auth/factories/make-set-access-pin-use-case';

import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function setMyAccessPinController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PATCH',
    url: '/v1/me/access-pin',
    preHandler: [verifyJwt],
    schema: {
      tags: ['Auth - Me'],
      summary: 'Set or update my access PIN (6 digits)',
      body: setAccessPinBodySchema,
      response: {
        200: z.object({ user: userResponseSchema }),
        400: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const userId = request.user.sub;
      const { currentPassword, newAccessPin } = request.body;

      try {
        const setAccessPinUseCase = makeSetAccessPinUseCase();

        const { user } = await setAccessPinUseCase.execute({
          userId,
          currentPassword,
          newAccessPin,
        });

        const userName = user.profile?.name
          ? `${user.profile.name} ${user.profile.surname || ''}`.trim()
          : user.username || user.email;

        await logAudit(request, {
          message: AUDIT_MESSAGES.CORE.ME_ACCESS_PIN_CHANGE,
          entityId: user.id.toString(),
          placeholders: { userName },
        });

        return reply.status(200).send({ user });
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
