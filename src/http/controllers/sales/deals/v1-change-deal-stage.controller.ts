import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  changeDealStageSchema,
  dealResponseSchema,
} from '@/http/schemas/sales/deals';
import { makeGetUserByIdUseCase } from '@/use-cases/core/users/factories/make-get-user-by-id-use-case';
import { makeChangeDealStageUseCase } from '@/use-cases/sales/deals/factories/make-change-deal-stage-use-case';
import { makeGetDealByIdUseCase } from '@/use-cases/sales/deals/factories/make-get-deal-by-id-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function changeDealStageController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PATCH',
    url: '/v1/deals/:dealId/stage',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.DEALS.MODIFY,
        resource: 'deals',
      }),
    ],
    schema: {
      tags: ['Sales - Deals'],
      summary: 'Change deal stage',
      params: z.object({
        dealId: z.string().uuid(),
      }),
      body: changeDealStageSchema,
      response: {
        200: z.object({
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
      const { dealId } = request.params as { dealId: string };
      const { stageId, lostReason } = request.body;
      const userId = request.user.sub;
      const tenantId = request.user.tenantId!;

      try {
        const getUserByIdUseCase = makeGetUserByIdUseCase();
        const getDealByIdUseCase = makeGetDealByIdUseCase();

        const [{ user }, { deal: oldDeal }] = await Promise.all([
          getUserByIdUseCase.execute({ userId }),
          getDealByIdUseCase.execute({ id: dealId, tenantId }),
        ]);
        const userName = user.profile?.name
          ? `${user.profile.name} ${user.profile.surname || ''}`.trim()
          : user.username || user.email;

        const fromStageId = oldDeal.stageId.toString();

        const useCase = makeChangeDealStageUseCase();
        const { deal } = await useCase.execute({
          id: dealId,
          tenantId,
          stageId,
          lostReason,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.SALES.DEAL_STAGE_CHANGE,
          entityId: dealId,
          placeholders: {
            userName,
            dealTitle: deal.title,
            fromStage: fromStageId,
            toStage: stageId,
          },
          oldData: { stageId: fromStageId },
          newData: { stageId, lostReason },
        });

        return reply.status(200).send({
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
