import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeResumeInventorySessionUseCase } from '@/use-cases/stock/inventory/factories/make-resume-inventory-session-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

const paramsSchema = z.object({
  id: z.string().uuid(),
});

const sessionResponseSchema = z.object({
  session: z.object({
    id: z.string(),
    status: z.string(),
    updatedAt: z.date().nullable(),
  }),
});

export async function resumeInventorySessionController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PATCH',
    url: '/v1/stock/inventory-sessions/:id/resume',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.STOCK.INVENTORY.REGISTER,
        resource: 'inventory',
      }),
    ],
    schema: {
      tags: ['Stock - Inventory Sessions'],
      summary: 'Resume a paused inventory session',
      params: paramsSchema,
      response: {
        200: sessionResponseSchema,
        400: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { id } = request.params;

      const useCase = makeResumeInventorySessionUseCase();
      const result = await useCase.execute({
        tenantId,
        sessionId: id,
      });

      return reply.status(200).send({
        session: {
          id: result.session.id.toString(),
          status: result.session.status,
          updatedAt: result.session.updatedAt ?? null,
        },
      });
    },
  });
}
