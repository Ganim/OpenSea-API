import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import {
  companyAddressResponseSchema,
  idSchema,
  listCompanyAddressesQuerySchema,
  paginationMetaSchema,
} from '@/http/schemas';
import { companyAddressToDTO } from '@/mappers/hr/company-address';
import { makeListCompanyAddressesUseCase } from '@/use-cases/hr/company-addresses/factories/make-company-addresses';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function listCompanyAddressesController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/hr/companies/:companyId/addresses',
    preHandler: [verifyJwt],
    schema: {
      tags: ['HR - Company Addresses'],
      summary: 'List company addresses',
      params: z.object({ companyId: idSchema }),
      querystring: listCompanyAddressesQuerySchema,
      response: {
        200: z.object({
          addresses: z.array(companyAddressResponseSchema),
          meta: paginationMetaSchema,
        }),
      },
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      const { companyId } = request.params as { companyId: string };
      const query = request.query as z.infer<
        typeof listCompanyAddressesQuerySchema
      >;

      const useCase = makeListCompanyAddressesUseCase();
      const { addresses, total, page, perPage } = await useCase.execute({
        companyId,
        type: query.type,
        isPrimary: query.isPrimary,
        includeDeleted: query.includeDeleted,
        page: query.page,
        perPage: query.perPage,
      });

      return reply.status(200).send({
        addresses: addresses.map(companyAddressToDTO),
        meta: {
          total,
          page,
          perPage,
          totalPages: Math.ceil(total / perPage),
        },
      });
    },
  });
}
