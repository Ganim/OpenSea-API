import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  reportProductionSchema,
  jobCardResponseSchema,
} from '@/http/schemas/production';
import { jobCardToDTO } from '@/mappers/production/job-card-to-dto';
import { makeGetUserByIdUseCase } from '@/use-cases/core/users/factories/make-get-user-by-id-use-case';
import { makeReportProductionUseCase } from '@/use-cases/production/job-cards/factories/make-report-production-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function reportProductionController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/production/job-cards/:id/report',
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
      summary: 'Report production on a job card',
      params: z.object({
        id: z.string(),
      }),
      body: reportProductionSchema,
      response: {
        200: z.object({
          jobCard: jobCardResponseSchema,
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
      const userId = request.user.sub;
      const { id } = request.params;
      const {
        operatorId,
        quantityGood,
        quantityScrapped,
        quantityRework,
        notes,
      } = request.body;

      const getUserByIdUseCase = makeGetUserByIdUseCase();
      const { user } = await getUserByIdUseCase.execute({ userId });
      const userName = user.profile?.name
        ? `${user.profile.name} ${user.profile.surname || ''}`.trim()
        : user.username || user.email;

      const reportProductionUseCase = makeReportProductionUseCase();
      const { jobCard } = await reportProductionUseCase.execute({
        jobCardId: id,
        tenantId,
        operatorId,
        quantityGood,
        quantityScrapped,
        quantityRework,
        notes,
      });

      await logAudit(request, {
        message: AUDIT_MESSAGES.PRODUCTION.PRODUCTION_REPORT,
        entityId: jobCard.jobCardId.toString(),
        placeholders: {
          userName,
          quantityGood: String(quantityGood),
          quantityScrapped: String(quantityScrapped ?? 0),
        },
        newData: {
          operatorId,
          quantityGood,
          quantityScrapped,
          quantityRework,
          notes,
        },
      });

      return reply.status(200).send({ jobCard: jobCardToDTO(jobCard) });
    },
  });
}
