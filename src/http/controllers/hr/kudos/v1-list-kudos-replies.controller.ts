import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { kudosReplyToDTO } from '@/mappers/hr/kudos-reply';
import { makeListKudosRepliesUseCase } from '@/use-cases/hr/kudos/factories/make-list-kudos-replies-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1ListKudosRepliesController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/hr/kudos/:id/replies',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.HR.KUDOS.ACCESS,
        resource: 'kudos',
      }),
    ],
    schema: {
      tags: ['HR - Kudos'],
      summary: 'List replies for a kudos',
      description:
        'Returns the active replies on a kudos in chronological order.',
      params: z.object({ id: z.string() }),
      response: {
        200: z.object({
          replies: z.array(
            z.object({
              id: z.string(),
              kudosId: z.string(),
              employeeId: z.string(),
              content: z.string(),
              createdAt: z.date(),
              updatedAt: z.date(),
            }),
          ),
        }),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const kudosId = request.params.id;

      try {
        const listKudosRepliesUseCase = makeListKudosRepliesUseCase();
        const { replies } = await listKudosRepliesUseCase.execute({
          tenantId,
          kudosId,
        });

        return reply
          .status(200)
          .send({ replies: replies.map(kudosReplyToDTO) });
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
