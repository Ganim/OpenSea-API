import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  companyCnaeResponseSchema,
  idSchema,
  listCompanyCnaesQuerySchema,
} from '@/http/schemas';
import { companyCnaeToDTO } from '@/mappers/hr/company-cnae';
import { makeListCompanyCnaesUseCase } from '@/use-cases/hr/company-cnaes/factories/make-company-cnaes';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function listCompanyCnaesController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/hr/companies/:companyId/cnaes',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.HR.COMPANY_CNAES.LIST,
        resource: 'company-cnaes',
      }),
    ],
    schema: {
      tags: ['HR - Company CNAEs'],
      summary: 'List CNAEs for a company',
      params: z.object({ companyId: idSchema }),
      querystring: listCompanyCnaesQuerySchema,
      response: {
        200: z.object({
          cnaes: z.array(companyCnaeResponseSchema),
          meta: z.object({
            page: z.number(),
            perPage: z.number(),
            total: z.number(),
          }),
        }),
        400: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      const { page, perPage, code, isPrimary, status, includeDeleted } =
        request.query;
      const { companyId } = request.params as { companyId: string };

      try {
        const useCase = makeListCompanyCnaesUseCase();
        const { cnaes, total } = await useCase.execute({
          companyId,
          page,
          perPage,
          code,
          isPrimary,
          status,
          includeDeleted,
        });

        return reply.status(200).send({
          cnaes: cnaes.map(companyCnaeToDTO),
          meta: {
            page,
            perPage,
            total,
          },
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
