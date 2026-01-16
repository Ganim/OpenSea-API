import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { makeGetUserByIdUseCase } from '@/use-cases/core/users/factories/make-get-user-by-id-use-case';
import { makeDeleteTemplateUseCase } from '@/use-cases/stock/templates/factories/make-delete-template-use-case';
import { makeGetTemplateByIdUseCase } from '@/use-cases/stock/templates/factories/make-get-template-by-id-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function deleteTemplateController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'DELETE',
    url: '/v1/templates/:id',
    preHandler: [
      verifyJwt,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.STOCK.TEMPLATES.DELETE,
        resource: 'templates',
      }),
    ],
    schema: {
      tags: ['Stock - Templates'],
      summary: 'Delete a template',
      params: z.object({
        id: z.uuid(),
      }),
      response: {
        204: z.null().describe('Template deleted successfully'),
        404: z.object({
          message: z.string(),
        }),
      },
    },
    handler: async (request, reply) => {
      const { id } = request.params as { id: string };
      const userId = request.user.sub;

      try {
        const getUserByIdUseCase = makeGetUserByIdUseCase();
        const getTemplateByIdUseCase = makeGetTemplateByIdUseCase();

        const [{ user }, { template }] = await Promise.all([
          getUserByIdUseCase.execute({ userId }),
          getTemplateByIdUseCase.execute({ id }),
        ]);
        const userName = user.profile?.name
          ? `${user.profile.name} ${user.profile.surname || ''}`.trim()
          : user.username || user.email;

        const deleteTemplate = makeDeleteTemplateUseCase();
        await deleteTemplate.execute({ id });

        await logAudit(request, {
          message: AUDIT_MESSAGES.STOCK.TEMPLATE_DELETE,
          entityId: id,
          placeholders: { userName, templateName: template.name },
          oldData: { id: template.id, name: template.name },
        });

        return reply.status(204).send();
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
