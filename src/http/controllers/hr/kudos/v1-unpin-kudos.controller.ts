import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { employeeKudosToDTO } from '@/mappers/hr/employee-kudos';
import { makeUnpinKudosUseCase } from '@/use-cases/hr/kudos/factories/make-unpin-kudos-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1UnpinKudosController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/hr/kudos/:id/unpin',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.HR.KUDOS.MODIFY,
        resource: 'kudos',
      }),
    ],
    schema: {
      tags: ['HR - Kudos'],
      summary: 'Unpin a kudos from the top of the feed',
      description: 'Clears the pinned flag and pin metadata from the kudos.',
      params: z.object({ id: z.string() }),
      response: {
        200: z.object({
          kudos: z.object({
            id: z.string(),
            fromEmployeeId: z.string(),
            toEmployeeId: z.string(),
            message: z.string(),
            category: z.string(),
            isPublic: z.boolean(),
            isPinned: z.boolean(),
            pinnedAt: z.date().nullable(),
            pinnedBy: z.string().nullable(),
            createdAt: z.date(),
          }),
        }),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const userId = request.user.sub;
      const kudosId = request.params.id;

      try {
        const unpinKudosUseCase = makeUnpinKudosUseCase();
        const { kudos: unpinnedKudos } = await unpinKudosUseCase.execute({
          tenantId,
          kudosId,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.HR.KUDOS_UNPIN,
          entityId: kudosId,
          placeholders: { userName: userId },
          newData: { isPinned: false },
        });

        return reply
          .status(200)
          .send({ kudos: employeeKudosToDTO(unpinnedKudos) });
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
