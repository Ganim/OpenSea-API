import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { idSchema } from '@/http/schemas';
import { makeGeneratePayslipPDFUseCase } from '@/use-cases/hr/payrolls/factories/make-generate-payslip-pdf-use-case';

import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1GeneratePayslipPDFController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/hr/payrolls/:payrollId/payslip/:employeeId',
    preHandler: [verifyJwt, verifyTenant],
    schema: {
      tags: ['HR - Payroll'],
      summary: 'Generate payslip PDF (holerite)',
      description:
        'Generates a PDF payslip (holerite) for an employee within a specific payroll, compliant with Art. 464 CLT.',
      params: z.object({
        payrollId: idSchema,
        employeeId: idSchema,
      }),
      querystring: z.object({
        companyName: z.string().optional(),
        companyCnpj: z.string().optional(),
      }),
      response: {
        200: z.any(),
        404: z.object({
          message: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { payrollId, employeeId } = request.params;
      const { companyName, companyCnpj } = request.query;

      try {
        const useCase = makeGeneratePayslipPDFUseCase();
        const { buffer, filename } = await useCase.execute({
          tenantId,
          payrollId,
          employeeId,
          companyName,
          companyCnpj,
        });

        return reply
          .status(200)
          .header('Content-Type', 'application/pdf')
          .header('Content-Disposition', `attachment; filename="${filename}"`)
          .send(buffer);
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
