import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { idSchema } from '@/http/schemas/common.schema';
import { makeDeleteCompanyUseCase } from '@/use-cases/hr/companies/factories/make-companies';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1DeleteCompanyController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'DELETE',
    url: '/v1/hr/companies/:id',
    preHandler: [
      verifyJwt,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.HR.COMPANIES.DELETE,
        resource: 'companies',
      }),
    ],
    schema: {
      tags: ['HR - Companies'],
      summary: 'Delete a company',
      description: 'Soft deletes a company (marks as deleted)',
      params: z.object({
        id: idSchema,
      }),
      response: {
        204: z.null(),
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

      try {
        const deleteCompanyUseCase = makeDeleteCompanyUseCase();
        await deleteCompanyUseCase.execute({ id });

        return reply.status(204).send();
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
