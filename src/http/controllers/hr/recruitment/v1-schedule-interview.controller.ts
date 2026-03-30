import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { interviewResponseSchema, scheduleInterviewSchema } from '@/http/schemas/hr/recruitment';
import { interviewToDTO } from '@/mappers/hr/interview';
import { makeScheduleInterviewUseCase } from '@/use-cases/hr/interviews/factories';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1ScheduleInterviewController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/hr/recruitment/interviews',
    preHandler: [verifyJwt, verifyTenant, createPermissionMiddleware({ permissionCode: PermissionCodes.HR.RECRUITMENT.REGISTER, resource: 'recruitment' })],
    schema: {
      tags: ['HR - Recruitment'],
      summary: 'Schedule interview',
      description: 'Schedules a new interview',
      body: scheduleInterviewSchema,
      response: { 201: z.object({ interview: interviewResponseSchema }), 400: z.object({ message: z.string() }), 404: z.object({ message: z.string() }) },
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const data = request.body;
      try {
        const useCase = makeScheduleInterviewUseCase();
        const { interview } = await useCase.execute({ tenantId, ...data });
        await logAudit(request, { message: AUDIT_MESSAGES.HR.INTERVIEW_SCHEDULE, entityId: interview.id.toString(), placeholders: { userName: request.user.sub, scheduledAt: interview.scheduledAt.toISOString() }, newData: data as Record<string, unknown> });
        return reply.status(201).send({ interview: interviewToDTO(interview) });
      } catch (error) {
        if (error instanceof ResourceNotFoundError) return reply.status(404).send({ message: error.message });
        if (error instanceof Error) return reply.status(400).send({ message: error.message });
        throw error;
      }
    },
  });
}
