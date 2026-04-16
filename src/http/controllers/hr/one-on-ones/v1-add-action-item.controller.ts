import { ForbiddenError } from '@/@errors/use-cases/forbidden-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  actionItemResponseSchema,
  createActionItemBodySchema,
  oneOnOneMeetingIdParamsSchema,
} from '@/http/schemas/hr/one-on-ones';
import { oneOnOneActionItemToDTO } from '@/mappers/hr/one-on-one-action-item';
import { makeGetMyEmployeeUseCase } from '@/use-cases/hr/employees/factories/make-get-my-employee-use-case';
import { makeAddActionItemUseCase } from '@/use-cases/hr/one-on-ones/factories';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1AddActionItemController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/hr/one-on-ones/:id/action-items',
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
      summary: 'Cria uma ação (action item) em uma reunião 1:1',
      params: oneOnOneMeetingIdParamsSchema,
      body: createActionItemBodySchema,
      response: {
        201: z.object({ actionItem: actionItemResponseSchema }),
        403: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      const { id } = request.params;
      const { content, ownerId, dueDate } = request.body;
      const userId = request.user.sub;
      const tenantId = request.user.tenantId!;

      try {
        const getMyEmployeeUseCase = makeGetMyEmployeeUseCase();
        const { employee: author } = await getMyEmployeeUseCase.execute({
          tenantId,
          userId,
        });

        const addActionItemUseCase = makeAddActionItemUseCase();
        const { actionItem } = await addActionItemUseCase.execute({
          tenantId,
          meetingId: id,
          authorEmployeeId: author.id.toString(),
          ownerId,
          content,
          dueDate,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.HR.ACTION_ITEM_ADD,
          entityId: actionItem.id.toString(),
          placeholders: { userName: userId, ownerName: ownerId },
          newData: {
            meetingId: id,
            ownerId,
            content,
            dueDate: dueDate?.toISOString() ?? null,
          },
        });

        return reply
          .status(201)
          .send({ actionItem: oneOnOneActionItemToDTO(actionItem) });
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
