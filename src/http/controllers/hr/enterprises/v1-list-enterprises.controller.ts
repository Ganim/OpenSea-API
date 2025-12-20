import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { verifyJwt } from '@/http/middlewares/verify-jwt';
import { verifyUserManager } from '@/http/middlewares/verify-user-manager';
import {
  enterpriseResponseSchema,
  listEnterprisesQuerySchema,
} from '@/http/schemas';
import { enterpriseToDTO } from '@/mappers/hr/enterprise/enterprise-to-dto';
import { makeListEnterprisesUseCase } from '@/use-cases/hr/enterprises/factories/make-enterprises';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function listEnterprisesController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/hr/enterprises',
    preHandler: [verifyJwt],
    schema: {
      tags: ['HR - Enterprises'],
      summary: 'List enterprises',
      description:
        'Lists all enterprises with optional filtering and pagination',
      querystring: listEnterprisesQuerySchema,
      response: {
        200: z.object({
          enterprises: z.array(enterpriseResponseSchema),
          total: z.number(),
          page: z.number(),
          perPage: z.number(),
        }),
        400: z.object({
          message: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const { page, perPage, search, includeDeleted } = request.query;

      try {
        const listEnterprisesUseCase = makeListEnterprisesUseCase();
        const {
          enterprises,
          total,
          page: responsePage,
          perPage: responsePerPage,
        } = await listEnterprisesUseCase.execute({
          page,
          perPage,
          search,
          includeDeleted,
        });

        return reply.status(200).send({
          enterprises: enterprises.map(enterpriseToDTO),
          total,
          page: responsePage,
          perPage: responsePerPage,
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
