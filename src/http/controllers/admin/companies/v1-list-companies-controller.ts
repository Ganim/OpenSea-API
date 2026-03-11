import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { companyToDTO } from '@/mappers/hr/company/company-to-dto';
import { makeListCompaniesUseCase } from '@/use-cases/admin/companies/factories/make-companies';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';
import { listCompaniesQuerySchema } from '../../hr/companies/company-api-schemas';

export async function v1ListCompaniesAdminController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/admin/companies',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.ADMIN.COMPANIES.READ,
        resource: 'companies',
      }),
    ],
    schema: {
      tags: ['Admin - Companies'],
      summary: 'List companies',
      description:
        'Lists companies with filtering, pagination and search capabilities (admin scope)',
      querystring: listCompaniesQuerySchema,
      response: {
        200: z.array(z.any()),
        400: z.object({
          message: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { page, perPage, search, includeDeleted } =
        request.query as z.infer<typeof listCompaniesQuerySchema>;

      try {
        const listUseCase = makeListCompaniesUseCase();
        const { companies } = await listUseCase.execute({
          tenantId,
          page: page ?? 1,
          perPage: perPage ?? 20,
          search,
          includeDeleted,
        });

        return reply.status(200).send(companies.map((c) => companyToDTO(c)));
      } catch (error) {
        if (error instanceof Error) {
          return reply.status(400).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
