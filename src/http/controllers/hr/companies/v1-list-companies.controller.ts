import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { companyToDTO } from '@/mappers/hr/company/company-to-dto';
import { makeListCompaniesUseCase } from '@/use-cases/hr/companies/factories/make-companies';
import type { FastifyInstance, FastifyReply } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';
import { listCompaniesQuerySchema } from './company-api-schemas';

export async function v1ListCompaniesController(app: FastifyInstance) {
  const listUseCase = makeListCompaniesUseCase();

  async function handleList(
    request: {
      query: unknown;
    },
    reply: FastifyReply,
    forceIncludeDeleted = false,
  ) {
    const { page, perPage, search, includeDeleted } = request.query as z.infer<
      typeof listCompaniesQuerySchema
    >;

    const shouldIncludeDeleted = forceIncludeDeleted ? true : includeDeleted;

    const { companies } = await listUseCase.execute({
      page: page ?? 1,
      perPage: perPage ?? 20,
      search,
      includeDeleted: shouldIncludeDeleted,
    });

    return reply.status(200).send(companies.map(companyToDTO));
  }

  // List active companies
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/hr/companies',
    preHandler: [verifyJwt],
    schema: {
      tags: ['HR - Companies'],
      summary: 'List companies',
      description:
        'Lists companies with filtering, pagination and search capabilities',
      querystring: listCompaniesQuerySchema,
      response: {
        200: z.array(z.any()),
        404: z.object({
          message: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      try {
        return await handleList(request, reply, false);
      } catch (error) {
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

  // List companies including deleted
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/hr/companies/all',
    preHandler: [verifyJwt],
    schema: {
      tags: ['HR - Companies'],
      summary: 'List companies including deleted',
      description: 'Lists companies including soft-deleted ones',
      querystring: listCompaniesQuerySchema,
      response: {
        200: z.array(z.any()),
        404: z.object({
          message: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      try {
        return await handleList(request, reply, true);
      } catch (error) {
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
