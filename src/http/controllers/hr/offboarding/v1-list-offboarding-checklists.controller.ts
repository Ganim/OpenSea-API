import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  listOffboardingChecklistsQuerySchema,
  offboardingChecklistResponseSchema,
  offboardingPaginationMetaSchema,
} from '@/http/schemas/hr/offboarding';
import { offboardingChecklistToDTO } from '@/mappers/hr/offboarding-checklist';
import { makeListOffboardingChecklistsUseCase } from '@/use-cases/hr/offboarding/factories/make-list-offboarding-checklists-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1ListOffboardingChecklistsController(
  app: FastifyInstance,
) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/hr/offboarding',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.HR.OFFBOARDING.ACCESS,
        resource: 'offboarding',
      }),
    ],
    schema: {
      tags: ['HR - Offboarding'],
      summary: 'List offboarding checklists',
      description:
        'Returns a paginated list of offboarding checklists with optional filters',
      querystring: listOffboardingChecklistsQuerySchema,
      response: {
        200: z.object({
          checklists: z.array(offboardingChecklistResponseSchema),
          meta: offboardingPaginationMetaSchema,
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { page, perPage, employeeId, status, search } = request.query;

      const listOffboardingChecklistsUseCase =
        makeListOffboardingChecklistsUseCase();
      const { checklists, meta } =
        await listOffboardingChecklistsUseCase.execute({
          tenantId,
          page,
          perPage,
          employeeId,
          status,
          search,
        });

      return reply.status(200).send({
        checklists: checklists.map(offboardingChecklistToDTO),
        meta,
      });
    },
  });
}
