import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  closePosSessionSchema,
  posSessionResponseSchema,
} from '@/http/schemas/sales/pos/pos-session.schema';
import { posSessionToDTO } from '@/mappers/sales/pos-session/pos-session-to-dto';
import { makeClosePosSessionUseCase } from '@/use-cases/sales/pos-sessions/factories/make-close-pos-session-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function v1CloseSessionController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/pos/sessions/:sessionId/close',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.POS.SESSIONS.CLOSE,
        resource: 'pos-sessions',
      }),
    ],
    schema: {
      tags: ['POS - Sessions'],
      summary: 'Close a POS session',
      params: z.object({ sessionId: z.string().uuid() }),
      body: closePosSessionSchema,
      response: {
        200: z.object({ session: posSessionResponseSchema }),
        400: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const userId = request.user.sub;
      const { sessionId } = request.params;
      const data = request.body;

      try {
        const useCase = makeClosePosSessionUseCase();
        const result = await useCase.execute({
          tenantId,
          sessionId,
          userId,
          ...data,
        });

        return reply.send({
          session: posSessionToDTO(result.session),
        });
      } catch (err) {
        if (err instanceof BadRequestError) {
          return reply.status(400).send({ message: err.message });
        }
        if (err instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: err.message });
        }
        throw err;
      }
    },
  });
}
