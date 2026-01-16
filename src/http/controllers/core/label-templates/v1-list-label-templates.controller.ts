import { PermissionCodes } from '@/constants/rbac';
import { getUserOrganizationId } from '@/http/helpers/organization.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import {
  labelTemplatesListResponseSchema,
  listLabelTemplatesQuerySchema,
} from '@/http/schemas/core/label-templates/label-template.schema';
import { makeListLabelTemplatesUseCase } from '@/use-cases/core/label-templates/factories/make-list-label-templates-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function listLabelTemplatesController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/label-templates',
    preHandler: [
      verifyJwt,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.CORE.LABEL_TEMPLATES.LIST,
        resource: 'label-templates',
      }),
    ],
    schema: {
      tags: ['Core - Label Templates'],
      summary: 'List all label templates',
      querystring: listLabelTemplatesQuerySchema,
      response: {
        200: labelTemplatesListResponseSchema,
        400: z.object({
          message: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      const userId = request.user.sub;
      const organizationId = await getUserOrganizationId(userId);

      if (!organizationId) {
        return reply
          .status(400)
          .send({ message: 'User must belong to an organization' });
      }

      const { includeSystem, search, page, limit } = request.query;

      const listLabelTemplatesUseCase = makeListLabelTemplatesUseCase();
      const { templates, total } = await listLabelTemplatesUseCase.execute({
        organizationId,
        includeSystem,
        search,
        page,
        limit,
      });

      return reply.status(200).send({ templates, total });
    },
  });
}
