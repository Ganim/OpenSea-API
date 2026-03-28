import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  listWarningsQuerySchema,
  paginationMetaSchema,
  warningResponseSchema,
} from '@/http/schemas/hr/warnings';
import { employeeWarningToDTO } from '@/mappers/hr/employee-warning';
import { makeListWarningsUseCase } from '@/use-cases/hr/warnings/factories/make-list-warnings-use-case';

import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1ListWarningsController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/hr/warnings',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.HR.WARNINGS.ACCESS,
        resource: 'warnings',
      }),
    ],
    schema: {
      tags: ['HR - Warnings'],
      summary: 'List employee warnings',
      description:
        'Retrieves a paginated list of employee warnings with optional filters',
      querystring: listWarningsQuerySchema,
      response: {
        200: z.object({
          warnings: z.array(warningResponseSchema),
          meta: paginationMetaSchema,
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { employeeId, type, severity, status, page, perPage } =
        request.query;

      const listWarningsUseCase = makeListWarningsUseCase();
      const { warnings, meta } = await listWarningsUseCase.execute({
        tenantId,
        employeeId,
        type,
        severity,
        status,
        page,
        perPage,
      });

      return reply.status(200).send({
        warnings: warnings.map(employeeWarningToDTO),
        meta,
      });
    },
  });
}
