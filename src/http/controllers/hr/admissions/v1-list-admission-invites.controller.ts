import { PermissionCodes } from '@/constants/rbac/permission-codes';
import { createPermissionMiddleware } from '@/http/middlewares/rbac/verify-permission';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  admissionInviteResponseSchema,
  admissionPaginationMetaSchema,
  listAdmissionInvitesQuerySchema,
} from '@/http/schemas/hr/admission';
import { makeListAdmissionInvitesUseCase } from '@/use-cases/hr/admissions/factories/make-list-admission-invites-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1ListAdmissionInvitesController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/hr/admissions',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.HR.ADMISSIONS.ACCESS,
      }),
    ],
    schema: {
      tags: ['HR - Admissions'],
      summary: 'List admission invites',
      description:
        'Returns a paginated list of admission invites with optional filters',
      querystring: listAdmissionInvitesQuerySchema,
      response: {
        200: z.object({
          invites: z.array(admissionInviteResponseSchema),
          meta: admissionPaginationMetaSchema,
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { page, perPage, status, search } = request.query;

      const useCase = makeListAdmissionInvitesUseCase();
      const { invites, meta } = await useCase.execute({
        tenantId,
        page,
        perPage,
        status,
        search,
      });

      return reply.status(200).send({ invites, meta });
    },
  });
}
