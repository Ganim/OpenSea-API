import { ConflictError } from '@/@errors/use-cases/conflict-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { applicationResponseSchema, createApplicationSchema } from '@/http/schemas/hr/recruitment';
import { applicationToDTO } from '@/mappers/hr/application';
import { makeCreateApplicationUseCase } from '@/use-cases/hr/applications/factories';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1CreateApplicationController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/hr/recruitment/applications',
    preHandler: [verifyJwt, verifyTenant, createPermissionMiddleware({ permissionCode: PermissionCodes.HR.RECRUITMENT.REGISTER, resource: 'recruitment' })],
    schema: {
      tags: ['HR - Recruitment'],
      summary: 'Create application',
      description: 'Creates a new job application for a candidate',
      body: createApplicationSchema,
      response: { 201: z.object({ application: applicationResponseSchema }), 400: z.object({ message: z.string() }), 404: z.object({ message: z.string() }), 409: z.object({ message: z.string() }) },
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const data = request.body;
      try {
        const useCase = makeCreateApplicationUseCase();
        const { application } = await useCase.execute({ tenantId, ...data });
        await logAudit(request, { message: AUDIT_MESSAGES.HR.APPLICATION_CREATE, entityId: application.id.toString(), placeholders: { userName: request.user.sub, jobTitle: data.jobPostingId }, newData: data as Record<string, unknown> });
        return reply.status(201).send({ application: applicationToDTO(application) });
      } catch (error) {
        if (error instanceof ResourceNotFoundError) return reply.status(404).send({ message: error.message });
        if (error instanceof ConflictError) return reply.status(409).send({ message: error.message });
        if (error instanceof Error) return reply.status(400).send({ message: error.message });
        throw error;
      }
    },
  });
}
