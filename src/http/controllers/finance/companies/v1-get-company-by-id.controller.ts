import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { idSchema } from '@/http/schemas/common.schema';
import { companyToDetailsDTO } from '@/mappers/core/company/company-to-dto';
import { departmentToDTO } from '@/mappers/hr/department/department-to-dto';
import { makeGetCompanyByIdUseCase } from '@/use-cases/admin/companies/factories/make-companies';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1GetFinanceCompanyByIdController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/finance/companies/:id',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.FINANCE.COMPANIES.READ,
        resource: 'companies',
      }),
    ],
    schema: {
      tags: ['Finance - Companies'],
      summary: 'Get company by ID (finance read-only)',
      description: 'Retrieves a single company by its ID with departments list',
      params: z.object({
        id: idSchema,
      }),
      response: {
        200: z.any(),
        400: z.object({
          message: z.string(),
        }),
        404: z.object({
          message: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { id } = request.params as { id: string };

      try {
        const getCompanyUseCase = makeGetCompanyByIdUseCase();
        const result = await getCompanyUseCase.execute({ tenantId, id });

        const companyData = companyToDetailsDTO({
          company: result.company,
          departments: result.departments,
        });

        return reply.status(200).send({
          ...companyData,
          departments: result.departments.map(departmentToDTO),
        });
      } catch (error) {
        if (error instanceof BadRequestError) {
          return reply.status(400).send({ message: error.message });
        }
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
