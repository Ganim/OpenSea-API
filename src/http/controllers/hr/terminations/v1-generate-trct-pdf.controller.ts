import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { idSchema } from '@/http/schemas';
import { makeGenerateTRCTPDFUseCase } from '@/use-cases/hr/terminations/factories/make-generate-trct-pdf-use-case';

import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1GenerateTRCTPDFController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/hr/terminations/:terminationId/trct',
    preHandler: [verifyJwt, verifyTenant],
    schema: {
      tags: ['HR - Terminations'],
      summary: 'Generate TRCT PDF',
      description:
        'Generates a TRCT (Termo de Rescisão do Contrato de Trabalho) PDF document compliant with Portaria MTP 671/2021.',
      params: z.object({
        terminationId: idSchema,
      }),
      querystring: z.object({
        companyName: z.string().optional(),
        companyCnpj: z.string().optional(),
        companyAddress: z.string().optional(),
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
      const { terminationId } = request.params;
      const { companyName, companyCnpj, companyAddress } = request.query;

      try {
        const useCase = makeGenerateTRCTPDFUseCase();
        const { buffer, filename } = await useCase.execute({
          tenantId,
          terminationId,
          companyName,
          companyCnpj,
          companyAddress,
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
