import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  tagResponseSchema,
  updateTagSchema,
} from '@/http/schemas/stock.schema';
import { makeGetUserByIdUseCase } from '@/use-cases/core/users/factories/make-get-user-by-id-use-case';
import { makeGetTagByIdUseCase } from '@/use-cases/stock/tags/factories/make-get-tag-by-id-use-case';
import { makeUpdateTagUseCase } from '@/use-cases/stock/tags/factories/make-update-tag-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function updateTagController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PUT',
    url: '/v1/tags/:id',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.STOCK.TAGS.UPDATE,
        resource: 'tags',
      }),
    ],
    schema: {
      tags: ['Stock - Tags'],
      summary: 'Update a tag',
      params: z.object({
        id: z.uuid(),
      }),
      body: updateTagSchema,
      response: {
        200: z.object({
          tag: tagResponseSchema,
        }),
        400: z.object({
          message: z.string(),
        }),
        404: z.object({
          message: z.string(),
        }),
      },
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { id } = request.params as { id: string };
      const userId = request.user.sub;

      try {
        const getUserByIdUseCase = makeGetUserByIdUseCase();
        const getTagByIdUseCase = makeGetTagByIdUseCase();

        const [{ user }, { tag: oldTag }] = await Promise.all([
          getUserByIdUseCase.execute({ userId }),
          getTagByIdUseCase.execute({ tenantId, id }),
        ]);
        const userName = user.profile?.name
          ? `${user.profile.name} ${user.profile.surname || ''}`.trim()
          : user.username || user.email;

        const updateTag = makeUpdateTagUseCase();
        const { tag } = await updateTag.execute({
          tenantId,
          id,
          ...request.body,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.STOCK.TAG_UPDATE,
          entityId: tag.id,
          placeholders: { userName, tagName: tag.name },
          oldData: { name: oldTag.name },
          newData: request.body,
        });

        return reply.status(200).send({ tag });
      } catch (error) {
        if (error instanceof BadRequestError) {
          return reply.status(400).send({ message: error.message });
        }
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
