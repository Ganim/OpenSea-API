import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  createJobCardSchema,
  jobCardResponseSchema,
} from '@/http/schemas/production';
import { jobCardToDTO } from '@/mappers/production/job-card-to-dto';
import { makeGetUserByIdUseCase } from '@/use-cases/core/users/factories/make-get-user-by-id-use-case';
import { makeCreateJobCardUseCase } from '@/use-cases/production/job-cards/factories/make-create-job-card-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function createJobCardController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/production/job-cards',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.PRODUCTION.SHOPFLOOR.REGISTER,
        resource: 'job-cards',
      }),
    ],
    schema: {
      tags: ['Production - Shop Floor'],
      summary: 'Create a new job card',
      body: createJobCardSchema,
      response: {
        201: z.object({
          jobCard: jobCardResponseSchema,
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
        operationRoutingId,
        workstationId,
        quantityPlanned,
        scheduledStart,
        scheduledEnd,
      } = request.body;

      const getUserByIdUseCase = makeGetUserByIdUseCase();
      const { user } = await getUserByIdUseCase.execute({ userId });
      const userName = user.profile?.name
        ? `${user.profile.name} ${user.profile.surname || ''}`.trim()
        : user.username || user.email;

      const createJobCardUseCase = makeCreateJobCardUseCase();
      const { jobCard } = await createJobCardUseCase.execute({
        productionOrderId,
        operationRoutingId,
        workstationId,
        quantityPlanned,
        scheduledStart,
        scheduledEnd,
      });

      await logAudit(request, {
        message: AUDIT_MESSAGES.PRODUCTION.JOB_CARD_START,
        entityId: jobCard.jobCardId.toString(),
        placeholders: { userName, operationName: operationRoutingId },
        newData: {
          productionOrderId,
          operationRoutingId,
          workstationId,
          quantityPlanned,
        },
      });

      return reply.status(201).send({ jobCard: jobCardToDTO(jobCard) });
    },
  });
}
