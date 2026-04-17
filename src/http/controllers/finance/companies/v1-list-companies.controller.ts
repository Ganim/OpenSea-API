import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { companyToDTO } from '@/mappers/core/company/company-to-dto';
import { makeListCompaniesUseCase } from '@/use-cases/admin/companies/factories/make-companies';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';
import { listCompaniesQuerySchema } from '@/http/schemas/core/companies/company.schema';
import { ErrorCodes } from '@/@errors/error-codes';
import { errorResponseSchema } from '@/http/schemas/common/error-response.schema';

export async function v1ListFinanceCompaniesController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/finance/companies',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.FINANCE.ENTRIES.ACCESS,
        resource: 'companies',
      }),
    ],
    schema: {
      tags: ['Finance - Companies'],
      summary: 'List companies (finance read-only)',
      description:
        'Lists companies with filtering, pagination and search capabilities (finance scope)',
      querystring: listCompaniesQuerySchema,
      response: {
        200: z.array(z.any()),
        400: errorResponseSchema,
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
          return reply.status(400).send({
            code: ErrorCodes.BAD_REQUEST,
            message: error.message,
            requestId: request.requestId,
          });
        }
        throw error;
      }
    },
  });
}
