import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
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
import { companyWithDetailsResponseSchema } from '../../hr/companies/company-api-schemas';

export async function v1GetCompanyAdminController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/admin/companies/:id',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.ADMIN.COMPANIES.ACCESS,
        resource: 'companies',
      }),
    ],
    schema: {
      tags: ['Admin - Companies'],
      summary: 'Get company by ID',
      description:
        'Retrieves a single company by its ID with departments list (admin scope)',
      params: z.object({
        id: idSchema,
      }),
      response: {
        200: companyWithDetailsResponseSchema,
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

        const response = {
          ...companyData,
          departments: result.departments.map(departmentToDTO),
          addresses: [],
          cnaes: [],
          fiscalSettings: null,
          stakeholders: [],
        };

        return reply.status(200).send(response);
      } catch (error) {
        if (error instanceof BadRequestError) {
          return reply.status(400).send({ message: error.message });
        }
        if (error instanceof Error && error.message.includes('not found')) {
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
