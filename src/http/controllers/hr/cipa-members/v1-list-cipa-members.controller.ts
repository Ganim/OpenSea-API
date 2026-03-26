import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  cipaMemberResponseSchema,
  listCipaMembersQuerySchema,
} from '@/http/schemas';
import { idSchema } from '@/http/schemas';
import { cipaMemberToDTO } from '@/mappers/hr/cipa-member';
import { makeListCipaMembersUseCase } from '@/use-cases/hr/cipa-members/factories/make-list-cipa-members-use-case';

import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1ListCipaMembersController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/hr/cipa-mandates/:mandateId/members',
    preHandler: [verifyJwt, verifyTenant],
    schema: {
      tags: ['HR - CIPA'],
      summary: 'List CIPA members',
      description: 'Lists all members of a CIPA mandate',
      params: z.object({
        mandateId: idSchema,
      }),
      querystring: listCipaMembersQuerySchema,
      response: {
        200: z.object({
          cipaMembers: z.array(cipaMemberResponseSchema),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { mandateId } = request.params;
      const filters = request.query;

      const useCase = makeListCipaMembersUseCase();
      const { cipaMembers } = await useCase.execute({
        tenantId,
        mandateId,
        ...filters,
      });

      return reply.status(200).send({
        cipaMembers: cipaMembers.map(cipaMemberToDTO),
      });
    },
  });
}
