import { ConflictError } from '@/@errors/use-cases/conflict-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UnprocessableEntityError } from '@/@errors/use-cases/unprocessable-entity-error';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { applicationResponseSchema } from '@/http/schemas/hr/recruitment';
import { cuidSchema } from '@/http/schemas/common.schema';
import { applicationToDTO } from '@/mappers/hr/application';
import { makeHireApplicationUseCase } from '@/use-cases/hr/applications/factories';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1HireApplicationController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PATCH',
    url: '/v1/hr/recruitment/applications/:applicationId/hire',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.HR.RECRUITMENT.ADMIN,
        resource: 'recruitment',
      }),
    ],
    schema: {
      tags: ['HR - Recruitment'],
      summary: 'Hire candidate',
      description: 'Marks an application as hired',
      params: z.object({ applicationId: cuidSchema }),
      response: {
        200: z.object({
          application: applicationResponseSchema,
          employeeId: z.string().nullable(),
          admissionId: z.string().nullable(),
        }),
        400: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
        409: z.object({ message: z.string() }),
        422: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { applicationId } = request.params;
      try {
        const useCase = makeHireApplicationUseCase();
        const { application, employee, admissionId } = await useCase.execute({
          tenantId,
          applicationId,
        });
        await logAudit(request, {
          message: AUDIT_MESSAGES.HR.APPLICATION_HIRE,
          entityId: application.id.toString(),
          placeholders: {
            userName: request.user.sub,
            candidateName: application.candidateId.toString(),
          },
        });
        return reply.status(200).send({
          application: applicationToDTO(application),
          employeeId: employee ? employee.id.toString() : null,
          admissionId,
        });
      } catch (error) {
        if (error instanceof ResourceNotFoundError)
          return reply.status(404).send({ message: error.message });
        if (error instanceof UnprocessableEntityError)
          return reply.status(422).send({ message: error.message });
        if (error instanceof ConflictError)
          return reply.status(409).send({ message: error.message });
        if (error instanceof Error)
          return reply.status(400).send({ message: error.message });
        throw error;
      }
    },
  });
}
