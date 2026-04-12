import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { posSessionResponseSchema } from '@/http/schemas/sales/pos/pos-session.schema';
import { posSessionToDTO } from '@/mappers/sales/pos-session/pos-session-to-dto';
import { OrphanSessionExistsError } from '@/use-cases/sales/pos-sessions/open-pos-session';
import { makeOpenTotemSessionUseCase } from '@/use-cases/sales/pos-sessions/factories/make-open-totem-session-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

const openTotemSessionBodySchema = z.object({
  totemCode: z.string().min(8).max(8),
});

export async function v1OpenTotemSessionController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/pos/sessions/open-totem',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.POS.SESSIONS.OPEN,
        resource: 'pos-sessions',
      }),
    ],
    schema: {
      tags: ['POS - Sessions'],
      summary: 'Open a session for a TOTEM terminal using its totemCode',
      body: openTotemSessionBodySchema,
      response: {
        201: z.object({ session: posSessionResponseSchema }),
        400: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
        409: z.object({
          message: z.string(),
          code: z.literal('ORPHAN_SESSION_EXISTS'),
          orphanSessionId: z.string(),
        }),
      },
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const operatorUserId = request.user.sub;
      const { totemCode } = request.body;

      try {
        const useCase = makeOpenTotemSessionUseCase();
        const { session } = await useCase.execute({
          tenantId,
          totemCode,
          operatorUserId,
        });
        return reply.status(201).send({ session: posSessionToDTO(session) });
      } catch (err) {
        if (err instanceof OrphanSessionExistsError) {
          return reply.status(409).send({
            message: err.message,
            code: 'ORPHAN_SESSION_EXISTS',
            orphanSessionId: err.orphanSessionId,
          });
        }
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
