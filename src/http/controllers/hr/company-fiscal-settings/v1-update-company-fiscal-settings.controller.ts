import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import {
  companyFiscalSettingsResponseSchema,
  idSchema,
  updateCompanyFiscalSettingsSchema,
} from '@/http/schemas';
import { companyFiscalSettingsToDTO } from '@/mappers/hr/company-fiscal-settings';
import { makeUpdateCompanyFiscalSettingsUseCase } from '@/use-cases/hr/company-fiscal-settings/factories/make-company-fiscal-settings';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function updateCompanyFiscalSettingsController(
  app: FastifyInstance,
) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PATCH',
    url: '/v1/hr/companies/:companyId/fiscal-settings',
    preHandler: [
      verifyJwt,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.HR.COMPANY_FISCAL_SETTINGS.UPDATE,
        resource: 'company-fiscal-settings',
      }),
    ],
    schema: {
      tags: ['HR - Company Fiscal Settings'],
      summary: 'Update company fiscal settings',
      params: z.object({ companyId: idSchema }),
      body: updateCompanyFiscalSettingsSchema,
      response: {
        200: z.object({ fiscalSettings: companyFiscalSettingsResponseSchema }),
        400: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      const { companyId } = request.params as { companyId: string };
      const data = request.body;

      try {
        const useCase = makeUpdateCompanyFiscalSettingsUseCase();
        const { fiscalSettings } = await useCase.execute({
          companyId,
          nfeEnvironment: data.nfeEnvironment,
          nfeSeries: data.nfeSeries,
          nfeLastNumber: data.nfeLastNumber,
          nfeDefaultOperationNature: data.nfeDefaultOperationNature,
          nfeDefaultCfop: data.nfeDefaultCfop,
          digitalCertificateType: data.digitalCertificateType,
          certificateA1ExpiresAt: data.certificateA1ExpiresAt,
          nfceEnabled: data.nfceEnabled,
          nfceCscId: data.nfceCscId,
          defaultTaxProfileId: data.defaultTaxProfileId,
          metadata: data.metadata,
        });

        return reply.status(200).send({
          fiscalSettings: companyFiscalSettingsToDTO(fiscalSettings) as any,
        });
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        if (error instanceof BadRequestError) {
          return reply.status(400).send({ message: error.message });
        }
        if (error instanceof Error) {
          return reply.status(400).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
