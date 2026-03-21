import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  createDealSchema,
  dealResponseSchema,
} from '@/http/schemas/sales/deals';
import { makeGetUserByIdUseCase } from '@/use-cases/core/users/factories/make-get-user-by-id-use-case';
import { makeCreateDealUseCase } from '@/use-cases/sales/deals/factories/make-create-deal-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function createDealController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/deals',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.DEALS.REGISTER,
        resource: 'deals',
      }),
    ],
    schema: {
      tags: ['Sales - Deals'],
      summary: 'Create a new deal',
      body: createDealSchema,
      response: {
        201: z.object({
          deal: dealResponseSchema,
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
      const userId = request.user.sub;
      const tenantId = request.user.tenantId!;
      const data = request.body;

      try {
        const getUserByIdUseCase = makeGetUserByIdUseCase();
        const { user } = await getUserByIdUseCase.execute({ userId });
        const userName = user.profile?.name
          ? `${user.profile.name} ${user.profile.surname || ''}`.trim()
          : user.username || user.email;

        const useCase = makeCreateDealUseCase();
        const { deal } = await useCase.execute({ tenantId, ...data });

        await logAudit(request, {
          message: AUDIT_MESSAGES.SALES.DEAL_CREATE,
          entityId: deal.id.toString(),
          placeholders: {
            userName,
            dealTitle: deal.title,
            pipelineName: data.pipelineId,
          },
          newData: {
            title: data.title,
            customerId: data.customerId,
            pipelineId: data.pipelineId,
            stageId: data.stageId,
            value: data.value,
          },
        });

        return reply.status(201).send({
          deal: {
            id: deal.id.toString(),
            tenantId: deal.tenantId.toString(),
            title: deal.title,
            customerId: deal.customerId.toString(),
            pipelineId: deal.pipelineId.toString(),
            stageId: deal.stageId.toString(),
            value: deal.value ?? null,
            currency: deal.currency,
            expectedCloseDate: deal.expectedCloseDate ?? null,
            probability: deal.probability ?? null,
            status: deal.status,
            lostReason: deal.lostReason ?? null,
            wonAt: deal.wonAt ?? null,
            lostAt: deal.lostAt ?? null,
            closedAt: deal.closedAt ?? null,
            assignedToUserId: deal.assignedToUserId?.toString() ?? null,
            tags: deal.tags,
            customFields: deal.customFields ?? null,
            stageEnteredAt: deal.stageEnteredAt,
            previousDealId: deal.previousDealId?.toString() ?? null,
            createdAt: deal.createdAt,
            updatedAt: deal.updatedAt ?? null,
            deletedAt: deal.deletedAt ?? null,
          },
        });
      } catch (error) {
        if (error instanceof BadRequestError) {
          return reply.status(400).send({ message: error.message });
        }
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
