import { PermissionCodes } from '@/constants/rbac';
import type {
  TerminationStatus,
  TerminationType,
} from '@/entities/hr/termination';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  listTerminationsQuerySchema,
  terminationResponseSchema,
} from '@/http/schemas';
import { terminationToDTO } from '@/mappers/hr/termination';
import { makeListTerminationsUseCase } from '@/use-cases/hr/terminations/factories/make-list-terminations-use-case';

import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1ListTerminationsController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/hr/terminations',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.HR.EMPLOYEES.ADMIN,
        resource: 'terminations',
      }),
    ],
    schema: {
      tags: ['HR - Terminations'],
      summary: 'List terminations',
      description:
        'Returns a paginated list of termination records with optional filters',
      querystring: listTerminationsQuerySchema,
      response: {
        200: z.object({
          data: z.array(terminationResponseSchema),
          meta: z.object({
            total: z.number().int().nonnegative(),
            page: z.number().int().positive(),
            limit: z.number().int().positive(),
            pages: z.number().int().nonnegative(),
          }),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { page, perPage, ...filters } = request.query;

      const useCase = makeListTerminationsUseCase();
      const { terminations, total } = await useCase.execute({
        tenantId,
        employeeId: filters.employeeId,
        status: filters.status as TerminationStatus | undefined,
        type: filters.type as TerminationType | undefined,
        startDate: filters.startDate,
        endDate: filters.endDate,
        page,
        perPage,
      });

      const limit = perPage ?? 20;
      const pages = Math.ceil(total / limit);

      return reply.status(200).send({
        data: terminations.map(terminationToDTO),
        meta: {
          total,
          page: page ?? 1,
          limit,
          pages,
        },
      });
    },
  });
}
