import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { companyFiscalSettingsResponseSchema, idSchema } from '@/http/schemas';
import { companyFiscalSettingsToDTO } from '@/mappers/hr/company-fiscal-settings';
import { makeGetCompanyFiscalSettingsUseCase } from '@/use-cases/hr/company-fiscal-settings/factories/make-company-fiscal-settings';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function getCompanyFiscalSettingsController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/hr/companies/:companyId/fiscal-settings',
    preHandler: [verifyJwt, verifyTenant],
    schema: {
      tags: ['HR - Company Fiscal Settings'],
      summary: 'Get company fiscal settings',
      params: z.object({ companyId: idSchema }),
      response: {
        200: z.object({ fiscalSettings: companyFiscalSettingsResponseSchema }),
        400: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      const { companyId } = request.params as { companyId: string };

      try {
        const useCase = makeGetCompanyFiscalSettingsUseCase();
        const { fiscalSettings } = await useCase.execute({
          companyId,
        });

        return reply.status(200).send({
          fiscalSettings: fiscalSettings
            ? companyFiscalSettingsToDTO(fiscalSettings)
            : null,
        });
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply
            .status(404)
            .send({ message: `${error.message} not found` });
        }
        if (error instanceof Error) {
          return reply.status(400).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
