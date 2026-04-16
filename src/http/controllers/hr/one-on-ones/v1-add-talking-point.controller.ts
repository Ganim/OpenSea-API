import { ForbiddenError } from '@/@errors/use-cases/forbidden-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  createTalkingPointBodySchema,
  oneOnOneMeetingIdParamsSchema,
  talkingPointResponseSchema,
} from '@/http/schemas/hr/one-on-ones';
import { oneOnOneTalkingPointToDTO } from '@/mappers/hr/one-on-one-talking-point';
import { makeGetMyEmployeeUseCase } from '@/use-cases/hr/employees/factories/make-get-my-employee-use-case';
import { makeAddTalkingPointUseCase } from '@/use-cases/hr/one-on-ones/factories';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1AddTalkingPointController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/hr/one-on-ones/:id/talking-points',
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
      summary: 'Adiciona um tópico de discussão a uma reunião 1:1',
      params: oneOnOneMeetingIdParamsSchema,
      body: createTalkingPointBodySchema,
      response: {
        201: z.object({ talkingPoint: talkingPointResponseSchema }),
        403: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      const { id } = request.params;
      const { content } = request.body;
      const userId = request.user.sub;
      const tenantId = request.user.tenantId!;

      try {
        const getMyEmployeeUseCase = makeGetMyEmployeeUseCase();
        const { employee: author } = await getMyEmployeeUseCase.execute({
          tenantId,
          userId,
        });

        const addTalkingPointUseCase = makeAddTalkingPointUseCase();
        const { talkingPoint } = await addTalkingPointUseCase.execute({
          tenantId,
          meetingId: id,
          authorEmployeeId: author.id.toString(),
          content,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.HR.TALKING_POINT_ADD,
          entityId: talkingPoint.id.toString(),
          placeholders: { userName: userId },
          newData: { meetingId: id, content },
        });

        return reply.status(201).send({
          talkingPoint: oneOnOneTalkingPointToDTO(talkingPoint),
        });
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
