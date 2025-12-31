import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { idSchema } from '@/http/schemas/common.schema';
import { companyStakeholderResponseSchema } from '@/http/schemas/hr.schema';
import { companyStakeholderToDTO } from '@/mappers/hr/company-stakeholder';
import { makeGetCompanyStakeholderUseCase } from '@/use-cases/hr/company-stakeholder/factories';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1GetCompanyStakeholders(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/hr/companies/:companyId/stakeholders',
    preHandler: [verifyJwt],
    schema: {
      tags: ['HR - Company Stakeholders'],
      summary: 'Get company stakeholders',
      params: z.object({ companyId: idSchema }),
      response: {
        200: z.array(companyStakeholderResponseSchema),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      const { companyId } = request.params as { companyId: string };

      try {
        const useCase = makeGetCompanyStakeholderUseCase();
        const { stakeholders } = await useCase.execute({
          companyId,
        });

        const dtos = stakeholders.map(companyStakeholderToDTO);

        return reply.status(200).send(dtos);
      } catch (error) {
        if (error instanceof Error && error.message.includes('not found')) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
