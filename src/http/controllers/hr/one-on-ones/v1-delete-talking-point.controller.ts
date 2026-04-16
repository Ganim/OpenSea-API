import { ForbiddenError } from '@/@errors/use-cases/forbidden-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeGetMyEmployeeUseCase } from '@/use-cases/hr/employees/factories/make-get-my-employee-use-case';
import { makeDeleteTalkingPointUseCase } from '@/use-cases/hr/one-on-ones/factories';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1DeleteTalkingPointController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'DELETE',
    url: '/v1/hr/one-on-ones/talking-points/:id',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.HR.ONE_ON_ONES.REMOVE,
        resource: 'one-on-ones',
      }),
    ],
    schema: {
      tags: ['HR - One-on-Ones'],
      summary: 'Remove um tópico de discussão',
      description: 'Apenas o autor pode remover o tópico.',
      params: z.object({ id: z.string().uuid() }),
      response: {
        204: z.null(),
        403: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      const { id } = request.params;
      const userId = request.user.sub;
      const tenantId = request.user.tenantId!;

      try {
        const getMyEmployeeUseCase = makeGetMyEmployeeUseCase();
        const { employee: viewer } = await getMyEmployeeUseCase.execute({
          tenantId,
          userId,
        });

        const deleteTalkingPointUseCase = makeDeleteTalkingPointUseCase();
        await deleteTalkingPointUseCase.execute({
          talkingPointId: id,
          viewerEmployeeId: viewer.id.toString(),
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.HR.TALKING_POINT_DELETE,
          entityId: id,
          placeholders: { userName: userId },
        });

        return reply.status(204).send(null);
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        if (error instanceof ForbiddenError) {
          return reply.status(403).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
