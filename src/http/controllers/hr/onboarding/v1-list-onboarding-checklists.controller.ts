import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  listOnboardingChecklistsQuerySchema,
  onboardingChecklistResponseSchema,
  paginationMetaSchema,
} from '@/http/schemas/hr/onboarding';
import { onboardingChecklistToDTO } from '@/mappers/hr/onboarding-checklist';
import { makeListOnboardingChecklistsUseCase } from '@/use-cases/hr/onboarding/factories/make-list-onboarding-checklists-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1ListOnboardingChecklistsController(
  app: FastifyInstance,
) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/hr/onboarding',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.HR.ONBOARDING.ACCESS,
        resource: 'onboarding',
      }),
    ],
    schema: {
      tags: ['HR - Onboarding'],
      summary: 'List onboarding checklists',
      description:
        'Returns a paginated list of onboarding checklists with optional filters',
      querystring: listOnboardingChecklistsQuerySchema,
      response: {
        200: z.object({
          checklists: z.array(onboardingChecklistResponseSchema),
          meta: paginationMetaSchema,
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { page, perPage, employeeId, status, search } = request.query;

      const listOnboardingChecklistsUseCase =
        makeListOnboardingChecklistsUseCase();
      const { checklists, meta } =
        await listOnboardingChecklistsUseCase.execute({
          tenantId,
          page,
          perPage,
          employeeId,
          status,
          search,
        });

      return reply.status(200).send({
        checklists: checklists.map(onboardingChecklistToDTO),
        meta,
      });
    },
  });
}
