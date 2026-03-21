import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { posSessionResponseSchema } from '@/http/schemas/sales/pos/pos-session.schema';
import { posSessionToDTO } from '@/mappers/sales/pos-session/pos-session-to-dto';
import { makeGetActivePosSessionUseCase } from '@/use-cases/sales/pos-sessions/factories/make-get-active-pos-session-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function v1GetActiveSessionController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/pos/terminals/:terminalId/session',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.POS.SESSIONS.ACCESS,
        resource: 'pos-sessions',
      }),
    ],
    schema: {
      tags: ['POS - Sessions'],
      summary: 'Get active session for a terminal',
      params: z.object({ terminalId: z.string().uuid() }),
      response: {
        200: z.object({ session: posSessionResponseSchema.nullable() }),
      },
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { terminalId } = request.params;

      const useCase = makeGetActivePosSessionUseCase();
      const result = await useCase.execute({ tenantId, terminalId });

      return reply.send({
        session: result.session ? posSessionToDTO(result.session) : null,
      });
    },
  });
}
