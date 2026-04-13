import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  updateOperationRoutingSchema,
  operationRoutingResponseSchema,
} from '@/http/schemas/production';
import { operationRoutingToDTO } from '@/mappers/production/operation-routing-to-dto';
import { makeGetUserByIdUseCase } from '@/use-cases/core/users/factories/make-get-user-by-id-use-case';
import { makeUpdateOperationRoutingUseCase } from '@/use-cases/production/operation-routings/factories/make-update-operation-routing-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function updateOperationRoutingController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PUT',
    url: '/v1/production/boms/:bomId/routings/:id',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.PRODUCTION.ENGINEERING.MODIFY,
        resource: 'operation-routings',
      }),
    ],
    schema: {
      tags: ['Production - Engineering'],
      summary: 'Update an operation routing step',
      params: z.object({
        bomId: z.string().uuid(),
        id: z.string().uuid(),
      }),
      body: updateOperationRoutingSchema,
      response: {
        200: z.object({
          operationRouting: operationRoutingResponseSchema,
        }),
        400: z.object({
          message: z.string(),
        }),
        404: z.object({
          message: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { bomId, id } = request.params;
      const {
        workstationId,
        sequence,
        operationName,
        description,
        setupTime,
        executionTime,
        waitTime,
        moveTime,
        isQualityCheck,
        isOptional,
        skillRequired,
        instructions,
        imageUrl,
      } = request.body;
      const userId = request.user.sub;

      const getUserByIdUseCase = makeGetUserByIdUseCase();
      const { user } = await getUserByIdUseCase.execute({ userId });
      const userName = user.profile?.name
        ? `${user.profile.name} ${user.profile.surname || ''}`.trim()
        : user.username || user.email;

      const updateOperationRoutingUseCase =
        makeUpdateOperationRoutingUseCase();
      const { operationRouting } =
        await updateOperationRoutingUseCase.execute({
          tenantId,
          bomId,
          id,
          workstationId,
          sequence,
          operationName,
          description,
          setupTime,
          executionTime,
          waitTime,
          moveTime,
          isQualityCheck,
          isOptional,
          skillRequired,
          instructions,
          imageUrl,
        });

      await logAudit(request, {
        message: AUDIT_MESSAGES.PRODUCTION.OPERATION_ROUTING_UPDATE,
        entityId: operationRouting.id.toString(),
        placeholders: { userName, operationName: operationRouting.operationName },
        newData: {
          bomId,
          workstationId,
          sequence,
          operationName,
          description,
          setupTime,
          executionTime,
          waitTime,
          moveTime,
          isQualityCheck,
          isOptional,
          skillRequired,
        },
      });

      return reply
        .status(200)
        .send({ operationRouting: operationRoutingToDTO(operationRouting) });
    },
  });
}
