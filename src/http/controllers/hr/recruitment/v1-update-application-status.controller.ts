import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  applicationResponseSchema,
  updateApplicationStatusSchema,
} from '@/http/schemas/hr/recruitment';
import { cuidSchema } from '@/http/schemas/common.schema';
import { applicationToDTO } from '@/mappers/hr/application';
import { makeUpdateApplicationStatusUseCase } from '@/use-cases/hr/applications/factories';

import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1UpdateApplicationStatusController(
  app: FastifyInstance,
) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PATCH',
    url: '/v1/hr/recruitment/applications/:applicationId/status',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.HR.RECRUITMENT.MODIFY,
        resource: 'recruitment',
      }),
    ],
    schema: {
      tags: ['HR - Recruitment'],
      summary: 'Update application status',
      description: 'Updates the status of a candidate application',
      params: z.object({ applicationId: cuidSchema }),
      body: updateApplicationStatusSchema,
      response: {
        200: z.object({ application: applicationResponseSchema }),
        400: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { applicationId } = request.params;
      const { status } = request.body;

      try {
        const useCase = makeUpdateApplicationStatusUseCase();
        const { application } = await useCase.execute({
          tenantId,
          applicationId,
          status,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.HR.APPLICATION_STATUS_UPDATE,
          entityId: application.id.toString(),
          placeholders: {
            userName: request.user.sub,
            newStatus: status,
          },
        });

        return reply
          .status(200)
          .send({ application: applicationToDTO(application) });
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        if (error instanceof BadRequestError) {
          return reply.status(400).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
