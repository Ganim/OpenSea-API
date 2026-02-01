import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { getUserOrganizationId } from '@/http/helpers/organization.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { labelTemplateResponseSchema } from '@/http/schemas/core/label-templates/label-template.schema';
import { makeGetLabelTemplateByIdUseCase } from '@/use-cases/core/label-templates/factories/make-get-label-template-by-id-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function getLabelTemplateByIdController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/label-templates/:id',
    preHandler: [
      verifyJwt,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.CORE.LABEL_TEMPLATES.READ,
        resource: 'label-templates',
      }),
    ],
    schema: {
      tags: ['Core - Label Templates'],
      summary: 'Get a label template by ID',
      params: z.object({
        id: z.string().uuid(),
      }),
      response: {
        200: z.object({
          template: labelTemplateResponseSchema,
        }),
        404: z.object({
          message: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      const userId = request.user.sub;
      const { id } = request.params;
      const organizationId = await getUserOrganizationId(userId);

      if (!organizationId) {
        return reply
          .status(400)
          .send({ message: 'User must belong to an organization' });
      }

      try {
        const getLabelTemplateByIdUseCase = makeGetLabelTemplateByIdUseCase();
        const { template } = await getLabelTemplateByIdUseCase.execute({
          id,
          organizationId,
        });

        return reply.status(200).send({ template });
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }

        throw error;
      }
    },
  });
}
