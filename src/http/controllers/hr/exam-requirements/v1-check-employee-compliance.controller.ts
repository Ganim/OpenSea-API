import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { employeeComplianceResponseSchema } from '@/http/schemas';
import { medicalExamToDTO } from '@/mappers/hr/medical-exam';
import { occupationalExamRequirementToDTO } from '@/mappers/hr/occupational-exam-requirement';
import { makeCheckEmployeeComplianceUseCase } from '@/use-cases/hr/exam-requirements/factories/make-check-employee-compliance-use-case';

import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1CheckEmployeeComplianceController(
  app: FastifyInstance,
) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/hr/medical-exams/compliance/:employeeId',
    preHandler: [verifyJwt, verifyTenant],
    schema: {
      tags: ['HR - Medical Exams'],
      summary: 'Check employee PCMSO compliance',
      description:
        'Checks if an employee meets all occupational exam requirements',
      params: z.object({
        employeeId: z.string().uuid(),
      }),
      response: {
        200: employeeComplianceResponseSchema,
        404: z.object({
          message: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { employeeId } = request.params;

      try {
        const useCase = makeCheckEmployeeComplianceUseCase();
        const compliance = await useCase.execute({ tenantId, employeeId });

        return reply.status(200).send({
          ...compliance,
          complianceItems: compliance.complianceItems.map((item) => ({
            requirement: occupationalExamRequirementToDTO(item.requirement),
            latestExam: item.latestExam
              ? medicalExamToDTO(item.latestExam)
              : null,
            status: item.status,
            daysUntilExpiry: item.daysUntilExpiry,
          })),
        });
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
