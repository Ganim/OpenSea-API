import { ForbiddenError } from '@/@errors/use-cases/forbidden-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeListEmailFoldersUseCase } from '@/use-cases/email/folders/factories/make-list-email-folders-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

const folderSchema = z.object({
  id: z.string().uuid(),
  accountId: z.string().uuid(),
  remoteName: z.string(),
  displayName: z.string(),
  type: z.enum(['INBOX', 'SENT', 'DRAFTS', 'TRASH', 'SPAM', 'CUSTOM']),
  uidValidity: z.number().int().nullable(),
  lastUid: z.number().int().nullable(),
  totalMessages: z.number().int(),
  unreadMessages: z.number().int(),
  updatedAt: z.coerce.date(),
});

export async function emailFoldersRoutes(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/email/folders',
    onRequest: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.EMAIL.MESSAGES.READ,
        resource: 'email-folders',
      }),
    ],
    schema: {
      tags: ['Email - Folders'],
      summary: 'List folders of an email account',
      security: [{ bearerAuth: [] }],
      querystring: z.object({
        accountId: z.string().uuid(),
      }),
      response: {
        200: z.object({ data: z.array(folderSchema) }),
        403: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const userId = request.user.sub;
      const { accountId } = request.query;

      try {
        const useCase = makeListEmailFoldersUseCase();
        const result = await useCase.execute({ tenantId, userId, accountId });

        return reply.status(200).send({ data: result.folders });
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        if (error instanceof ForbiddenError) {
          return reply.status(403).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
