import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import {
  companyFiscalSettingsResponseSchema,
  createCompanyFiscalSettingsSchema,
  idSchema,
} from '@/http/schemas';
import { companyFiscalSettingsToDTO } from '@/mappers/hr/company-fiscal-settings';
import { makeCreateCompanyFiscalSettingsUseCase } from '@/use-cases/hr/company-fiscal-settings/factories/make-company-fiscal-settings';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function createCompanyFiscalSettingsController(
  app: FastifyInstance,
) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/hr/companies/:companyId/fiscal-settings',
    preHandler: [
      verifyJwt,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.HR.COMPANY_FISCAL_SETTINGS.CREATE,
        resource: 'company-fiscal-settings',
      }),
    ],
    schema: {
      tags: ['HR - Company Fiscal Settings'],
      summary: 'Create company fiscal settings',
      params: z.object({ companyId: idSchema }),
      body: createCompanyFiscalSettingsSchema,
      response: {
        201: z.object({ fiscalSettings: companyFiscalSettingsResponseSchema }),
        400: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      const { companyId } = request.params as { companyId: string };
      const data = request.body;

      try {
        const useCase = makeCreateCompanyFiscalSettingsUseCase();
        const { fiscalSettings } = await useCase.execute({
          companyId,
          nfeEnvironment: data.nfeEnvironment as string | undefined,
          nfeSeries: data.nfeSeries,
          nfeLastNumber: data.nfeLastNumber,
          nfeDefaultOperationNature: data.nfeDefaultOperationNature,
          nfeDefaultCfop: data.nfeDefaultCfop,
          digitalCertificateType: data.digitalCertificateType as
            | string
            | undefined,
          certificateA1ExpiresAt: data.certificateA1ExpiresAt as
            | Date
            | undefined,
          nfceEnabled: data.nfceEnabled,
          nfceCscId: data.nfceCscId,
          defaultTaxProfileId: data.defaultTaxProfileId,
        });

        return reply.status(201).send({
          fiscalSettings: companyFiscalSettingsToDTO(fiscalSettings),
        });
      } catch (error) {
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
