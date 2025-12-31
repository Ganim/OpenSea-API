import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { companyCnaeResponseSchema, idSchema } from '@/http/schemas';
import { companyCnaeToDTO } from '@/mappers/hr/company-cnae';
import { makeGetPrimaryCompanyCnaeUseCase } from '@/use-cases/hr/company-cnaes/factories/make-company-cnaes';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function getPrimaryCompanyCnaeController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/hr/companies/:companyId/cnaes/primary',
    preHandler: [
      verifyJwt,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.HR.COMPANY_CNAES.READ,
        resource: 'company-cnaes',
      }),
    ],
    schema: {
      tags: ['HR - Company CNAEs'],
      summary: 'Get primary CNAE for a company',
      params: z.object({ companyId: idSchema }),
      response: {
        200: z.object({ cnae: companyCnaeResponseSchema.nullable() }),
        400: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      const { companyId } = request.params as { companyId: string };

      try {
        const useCase = makeGetPrimaryCompanyCnaeUseCase();
        const { cnae } = await useCase.execute({
          companyId,
        });

        return reply.status(200).send({
          cnae: cnae ? companyCnaeToDTO(cnae) : null,
        });
      } catch (error) {
        if (error instanceof Error) {
          return reply.status(400).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
