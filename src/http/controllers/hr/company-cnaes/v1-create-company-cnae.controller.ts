import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  companyCnaeResponseSchema,
  createCompanyCnaeSchema,
  idSchema,
} from '@/http/schemas';
import { companyCnaeToDTO } from '@/mappers/hr/company-cnae';
import { makeCreateCompanyCnaeUseCase } from '@/use-cases/hr/company-cnaes/factories/make-company-cnaes';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function createCompanyCnaeController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/hr/companies/:companyId/cnaes',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.HR.COMPANY_CNAES.CREATE,
        resource: 'company-cnaes',
      }),
    ],
    schema: {
      tags: ['HR - Company CNAEs'],
      summary: 'Create a new CNAE for a company',
      params: z.object({ companyId: idSchema }),
      body: createCompanyCnaeSchema,
      response: {
        201: z.object({ cnae: companyCnaeResponseSchema }),
        400: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      const data = request.body;
      const { companyId } = request.params as { companyId: string };

      try {
        const useCase = makeCreateCompanyCnaeUseCase();
        const { cnae } = await useCase.execute({
          companyId,
          code: data.code,
          description: data.description,
          isPrimary: data.isPrimary,
          status: data.status,
          metadata: data.metadata,
        });

        return reply.status(201).send({ cnae: companyCnaeToDTO(cnae) });
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
