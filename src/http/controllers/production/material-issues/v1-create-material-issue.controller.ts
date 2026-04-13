import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  createMaterialIssueSchema,
  materialIssueResponseSchema,
} from '@/http/schemas/production';
import { materialIssueToDTO } from '@/mappers/production/material-issue-to-dto';
import { makeGetUserByIdUseCase } from '@/use-cases/core/users/factories/make-get-user-by-id-use-case';
import { makeCreateMaterialIssueUseCase } from '@/use-cases/production/material-issues/factories/make-create-material-issue-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function createMaterialIssueController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/production/material-issues',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.PRODUCTION.ORDERS.REGISTER,
        resource: 'material-issues',
      }),
    ],
    schema: {
      tags: ['Production - Materials'],
      summary: 'Create a material issue (requisition)',
      body: createMaterialIssueSchema,
      response: {
        201: z.object({
          materialIssue: materialIssueResponseSchema,
        }),
        400: z.object({
          message: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const userId = request.user.sub;
      const {
        productionOrderId,
        materialId,
        warehouseId,
        quantity,
        batchNumber,
        notes,
      } = request.body;

      const getUserByIdUseCase = makeGetUserByIdUseCase();
      const { user } = await getUserByIdUseCase.execute({ userId });
      const userName = user.profile?.name
        ? `${user.profile.name} ${user.profile.surname || ''}`.trim()
        : user.username || user.email;

      const createMaterialIssueUseCase = makeCreateMaterialIssueUseCase();
      const { materialIssue } = await createMaterialIssueUseCase.execute({
        productionOrderId,
        materialId,
        warehouseId,
        quantity,
        batchNumber,
        issuedById: userId,
        notes,
      });

      await logAudit(request, {
        message: AUDIT_MESSAGES.PRODUCTION.MATERIAL_ISSUE,
        entityId: materialIssue.materialIssueId.toString(),
        placeholders: { userName, orderNumber: productionOrderId },
        newData: {
          productionOrderId,
          materialId,
          warehouseId,
          quantity,
          batchNumber,
          notes,
        },
      });

      return reply
        .status(201)
        .send({ materialIssue: materialIssueToDTO(materialIssue) });
    },
  });
}
