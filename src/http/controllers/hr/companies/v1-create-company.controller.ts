import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { companyToDTO } from '@/mappers/hr/company/company-to-dto';
import { makeCreateCompanyUseCase } from '@/use-cases/hr/companies/factories/make-companies';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';
import {
  companyResponseSchema,
  createCompanyRequestSchema,
  wrapCompanyResponse,
} from './company-api-schemas';

export async function v1CreateCompanyController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/hr/companies',
    preHandler: [
      verifyJwt,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.HR.COMPANIES.CREATE,
        resource: 'companies',
      }),
    ],
    schema: {
      tags: ['HR - Companies'],
      summary: 'Create a new company',
      description: 'Creates a new company in the system',
      body: createCompanyRequestSchema,
      response: {
        201: companyResponseSchema,
        400: z.object({
          message: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const data = request.body;

      try {
        const createCompanyUseCase = makeCreateCompanyUseCase();
        const { company } = await createCompanyUseCase.execute(data);

        return reply
          .status(201)
          .send(wrapCompanyResponse(companyToDTO(company) as any));
      } catch (error) {
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
