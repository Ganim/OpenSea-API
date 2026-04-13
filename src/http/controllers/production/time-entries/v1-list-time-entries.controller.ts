import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { timeEntryResponseSchema } from '@/http/schemas/production';
import { timeEntryToDTO } from '@/mappers/production/time-entry-to-dto';
import { makeListTimeEntriesUseCase } from '@/use-cases/production/time-entries/factories/make-list-time-entries-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function listTimeEntriesController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/production/time-entries',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.PRODUCTION.SHOPFLOOR.ACCESS,
        resource: 'time-entries',
      }),
    ],
    schema: {
      tags: ['Production - Shop Floor'],
      summary: 'List time entries by job card',
      querystring: z.object({
        jobCardId: z.string().min(1),
      }),
      response: {
        200: z.object({
          timeEntries: z.array(timeEntryResponseSchema),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const { jobCardId } = request.query;

      const listTimeEntriesUseCase = makeListTimeEntriesUseCase();
      const { timeEntries } = await listTimeEntriesUseCase.execute({
        jobCardId,
      });

      return reply.status(200).send({
        timeEntries: timeEntries.map(timeEntryToDTO),
      });
    },
  });
}
