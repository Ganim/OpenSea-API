import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { idSchema } from '@/http/schemas';
import { makeGeneratePunchReceiptPDFUseCase } from '@/use-cases/hr/time-control/factories/make-generate-punch-receipt-pdf-use-case';

import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1GeneratePunchReceiptPDFController(
  app: FastifyInstance,
) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/hr/time-control/entries/:timeEntryId/receipt',
    preHandler: [verifyJwt, verifyTenant],
    schema: {
      tags: ['HR - Time Control'],
      summary: 'Generate punch receipt PDF (comprovante de ponto)',
      description:
        'Generates a Portaria 671 compliant punch receipt PDF for a specific time entry, containing employer/employee identification, timestamp, NSR, entry type, and location.',
      params: z.object({
        timeEntryId: idSchema,
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
      const { timeEntryId } = request.params;
      const { companyName, companyCnpj } = request.query;

      try {
        const useCase = makeGeneratePunchReceiptPDFUseCase();
        const { buffer, filename } = await useCase.execute({
          tenantId,
          timeEntryId,
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
