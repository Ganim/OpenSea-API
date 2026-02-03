import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { companyCnaeResponseSchema, idSchema } from '@/http/schemas';
import { companyCnaeToDTO } from '@/mappers/hr/company-cnae';
import { makeGetCompanyCnaeUseCase } from '@/use-cases/hr/company-cnaes/factories/make-company-cnaes';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function getCompanyCnaeController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/hr/companies/:companyId/cnaes/:cnaeId',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.HR.COMPANY_CNAES.READ,
        resource: 'company-cnaes',
      }),
    ],
    schema: {
      tags: ['HR - Company CNAEs'],
      summary: 'Get a specific CNAE',
      params: z.object({
        companyId: idSchema,
        cnaeId: idSchema,
      }),
      response: {
        200: z.object({ cnae: companyCnaeResponseSchema }),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      const { companyId, cnaeId } = request.params as {
        companyId: string;
        cnaeId: string;
      };

      try {
        const useCase = makeGetCompanyCnaeUseCase();
        const { cnae } = await useCase.execute({
          cnaeId,
          companyId,
        });

        return reply.status(200).send({ cnae: companyCnaeToDTO(cnae) });
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        if (error instanceof Error) {
          return reply.status(400).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
