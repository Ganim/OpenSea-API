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
  updateActionItemBodySchema,
} from '@/http/schemas/hr/one-on-ones';
import { oneOnOneActionItemToDTO } from '@/mappers/hr/one-on-one-action-item';
import { makeGetMyEmployeeUseCase } from '@/use-cases/hr/employees/factories/make-get-my-employee-use-case';
import { makeUpdateActionItemUseCase } from '@/use-cases/hr/one-on-ones/factories';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1UpdateActionItemController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PATCH',
    url: '/v1/hr/one-on-ones/action-items/:id',
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
      summary: 'Atualiza uma ação (action item)',
      params: z.object({ id: z.string().uuid() }),
      body: updateActionItemBodySchema,
      response: {
        200: z.object({ actionItem: actionItemResponseSchema }),
        403: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      const { id } = request.params;
      const { content, ownerId, dueDate, isCompleted } = request.body;
      const userId = request.user.sub;
      const tenantId = request.user.tenantId!;

      try {
        const getMyEmployeeUseCase = makeGetMyEmployeeUseCase();
        const { employee: viewer } = await getMyEmployeeUseCase.execute({
          tenantId,
          userId,
        });

        const updateActionItemUseCase = makeUpdateActionItemUseCase();
        const { actionItem } = await updateActionItemUseCase.execute({
          tenantId,
          actionItemId: id,
          viewerEmployeeId: viewer.id.toString(),
          content,
          ownerId,
          dueDate: dueDate ?? undefined,
          isCompleted,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.HR.ACTION_ITEM_UPDATE,
          entityId: actionItem.id.toString(),
          placeholders: { userName: userId },
          newData: { content, ownerId, dueDate, isCompleted },
        });

        return reply
          .status(200)
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
