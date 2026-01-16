import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { labelTemplatesListResponseSchema } from '@/http/schemas/core/label-templates/label-template.schema';
import { makeListSystemLabelTemplatesUseCase } from '@/use-cases/core/label-templates/factories/make-list-system-label-templates-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';

export async function listSystemLabelTemplatesController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/label-templates/system',
    preHandler: [
      verifyJwt,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.CORE.LABEL_TEMPLATES.READ,
        resource: 'label-templates',
      }),
    ],
    schema: {
      tags: ['Core - Label Templates'],
      summary: 'List all system label templates',
      response: {
        200: labelTemplatesListResponseSchema,
      },
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      const listSystemLabelTemplatesUseCase =
        makeListSystemLabelTemplatesUseCase();
      const { templates, total } =
        await listSystemLabelTemplatesUseCase.execute();

      return reply.status(200).send({ templates, total });
    },
  });
}
