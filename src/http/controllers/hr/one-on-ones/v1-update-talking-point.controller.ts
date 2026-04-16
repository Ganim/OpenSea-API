import { ForbiddenError } from '@/@errors/use-cases/forbidden-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  talkingPointResponseSchema,
  updateTalkingPointBodySchema,
} from '@/http/schemas/hr/one-on-ones';
import { oneOnOneTalkingPointToDTO } from '@/mappers/hr/one-on-one-talking-point';
import { makeGetMyEmployeeUseCase } from '@/use-cases/hr/employees/factories/make-get-my-employee-use-case';
import { makeUpdateTalkingPointUseCase } from '@/use-cases/hr/one-on-ones/factories';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1UpdateTalkingPointController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PATCH',
    url: '/v1/hr/one-on-ones/talking-points/:id',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.HR.ONE_ON_ONES.MODIFY,
        resource: 'one-on-ones',
      }),
    ],
    schema: {
      tags: ['HR - One-on-Ones'],
      summary: 'Atualiza um tópico de discussão',
      description:
        'Apenas o autor pode editar o conteúdo. Qualquer participante pode marcar como resolvido.',
      params: z.object({ id: z.string().uuid() }),
      body: updateTalkingPointBodySchema,
      response: {
        200: z.object({ talkingPoint: talkingPointResponseSchema }),
        403: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      const { id } = request.params;
      const { content, isResolved } = request.body;
      const userId = request.user.sub;
      const tenantId = request.user.tenantId!;

      try {
        const getMyEmployeeUseCase = makeGetMyEmployeeUseCase();
        const { employee: viewer } = await getMyEmployeeUseCase.execute({
          tenantId,
          userId,
        });

        const updateTalkingPointUseCase = makeUpdateTalkingPointUseCase();
        const { talkingPoint } = await updateTalkingPointUseCase.execute({
          tenantId,
          talkingPointId: id,
          viewerEmployeeId: viewer.id.toString(),
          content,
          isResolved,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.HR.TALKING_POINT_UPDATE,
          entityId: talkingPoint.id.toString(),
          placeholders: { userName: userId },
          newData: { content, isResolved },
        });

        return reply
          .status(200)
          .send({ talkingPoint: oneOnOneTalkingPointToDTO(talkingPoint) });
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
