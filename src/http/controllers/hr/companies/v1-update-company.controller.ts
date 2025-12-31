import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { idSchema } from '@/http/schemas/common.schema';
import { companyToDTO } from '@/mappers/hr/company/company-to-dto';
import { makeUpdateCompanyUseCase } from '@/use-cases/hr/companies/factories/make-companies';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';
import {
  companyResponseSchema,
  updateCompanyRequestSchema,
  wrapCompanyResponse,
} from './company-api-schemas';

export async function v1UpdateCompanyController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PATCH',
    url: '/v1/hr/companies/:id',
    preHandler: [
      verifyJwt,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.HR.COMPANIES.UPDATE,
        resource: 'companies',
      }),
    ],
    schema: {
      tags: ['HR - Companies'],
      summary: 'Update a company',
      description: 'Updates the information of an existing company',
      params: z.object({
        id: idSchema,
      }),
      body: updateCompanyRequestSchema,
      response: {
        200: companyResponseSchema,
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
      const { id } = request.params as { id: string };
      const data = request.body;

      try {
        const updateCompanyUseCase = makeUpdateCompanyUseCase();
        const { company } = await updateCompanyUseCase.execute({
          id,
          ...data,
        });

        if (!company) {
          return reply.status(404).send({ message: 'Company not found' });
        }

        return reply
          .status(200)
          .send(wrapCompanyResponse(companyToDTO(company) as any));
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
