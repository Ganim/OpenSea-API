import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeDeleteSignatureTemplateUseCase } from '@/use-cases/signature/templates/factories/make-delete-template-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function deleteTemplateController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'DELETE',
    url: '/v1/signature/templates/:templateId',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.TOOLS.SIGNATURE.TEMPLATES.REMOVE,
        resource: 'signature-templates',
      }),
    ],
    schema: {
      tags: ['Tools - Digital Signature'],
      summary: 'Delete a signature template',
      params: z.object({
        templateId: z.string().uuid().describe('Signature template UUID'),
      }),
      response: {
        204: z.null(),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { templateId } = request.params;

      const useCase = makeDeleteSignatureTemplateUseCase();
      await useCase.execute({ tenantId, templateId });

      return reply.status(204).send(null);
    },
  });
}
