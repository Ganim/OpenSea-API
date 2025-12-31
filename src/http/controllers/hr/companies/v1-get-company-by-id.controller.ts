import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { idSchema } from '@/http/schemas/common.schema';
import { prisma } from '@/lib/prisma';
import { companyToDetailsDTO } from '@/mappers/hr/company/company-to-dto';
import { departmentToDTO } from '@/mappers/hr/department/department-to-dto';
import { makeGetCompanyByIdUseCase } from '@/use-cases/hr/companies/factories/make-companies';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';
import {
  companyWithDetailsResponseSchema,
  wrapCompanyResponse,
} from './company-api-schemas';

export async function v1GetCompanyByIdController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/hr/companies/:id',
    preHandler: [verifyJwt],
    schema: {
      tags: ['HR - Companies'],
      summary: 'Get company by ID',
      description:
        'Retrieves a single company by its ID with departments list',
      params: z.object({
        id: idSchema,
      }),
      response: {
        200: companyWithDetailsResponseSchema,
        404: z.object({
          message: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const { id } = request.params as { id: string };

      try {
        const getCompanyUseCase = makeGetCompanyByIdUseCase();
        const result = await getCompanyUseCase.execute({ id });

        // Buscar relacionamentos adicionais (addresses, cnaes, fiscalSettings, stakeholders)
        const [addresses, cnaes, fiscalSettings, stakeholders] =
          await Promise.all([
            prisma.companyAddress.findMany({
              where: { companyId: id, deletedAt: null },
              orderBy: { isPrimary: 'desc' },
            }),
            prisma.companyCnae.findMany({
              where: { companyId: id, deletedAt: null },
              orderBy: { isPrimary: 'desc' },
            }),
            prisma.companyFiscalSettings.findFirst({
              where: { companyId: id, deletedAt: null },
            }),
            prisma.companyStakeholder.findMany({
              where: { companyId: id, deletedAt: null },
              orderBy: { createdAt: 'desc' },
            }),
          ]);

        const companyData = companyToDetailsDTO({
          company: result.company,
          departments: result.departments,
        });
        const response = {
          ...companyData,
          departments: result.departments.map(departmentToDTO),
          addresses: addresses || [],
          cnaes: cnaes || [],
          fiscalSettings: fiscalSettings || null,
          stakeholders: stakeholders || [],
        } as any; // Type assertion needed due to extended response with relations

        return reply.status(200).send(wrapCompanyResponse(response));
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
