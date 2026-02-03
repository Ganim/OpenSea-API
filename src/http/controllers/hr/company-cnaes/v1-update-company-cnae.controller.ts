import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  companyCnaeResponseSchema,
  idSchema,
  updateCompanyCnaeSchema,
} from '@/http/schemas';
import { companyCnaeToDTO } from '@/mappers/hr/company-cnae';
import { makeUpdateCompanyCnaeUseCase } from '@/use-cases/hr/company-cnaes/factories/make-company-cnaes';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function updateCompanyCnaeController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PUT',
    url: '/v1/hr/companies/:companyId/cnaes/:cnaeId',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.HR.COMPANY_CNAES.UPDATE,
        resource: 'company-cnaes',
      }),
    ],
    schema: {
      tags: ['HR - Company CNAEs'],
      summary: 'Update a CNAE',
      params: z.object({
        companyId: idSchema,
        cnaeId: idSchema,
      }),
      body: updateCompanyCnaeSchema,
      response: {
        200: z.object({ cnae: companyCnaeResponseSchema }),
        400: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      const data = request.body;
      const { companyId, cnaeId } = request.params as {
        companyId: string;
        cnaeId: string;
      };

      try {
        const useCase = makeUpdateCompanyCnaeUseCase();
        const { cnae } = await useCase.execute({
          cnaeId,
          companyId,
          code: data.code,
          description: data.description,
          isPrimary: data.isPrimary,
          status: data.status,
          metadata: data.metadata,
        });

        return reply.status(200).send({ cnae: companyCnaeToDTO(cnae) });
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
