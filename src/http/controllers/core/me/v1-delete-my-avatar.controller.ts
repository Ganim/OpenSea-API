import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { logAudit } from '@/http/helpers/audit.helper';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { prisma } from '@/lib/prisma';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function deleteMyAvatarController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'DELETE',
    url: '/v1/me/avatar',
    onRequest: [verifyJwt, verifyTenant],
    schema: {
      tags: ['Auth - Me'],
      summary: 'Remove my avatar',
      description:
        'Removes the user avatar. Soft-deletes the file from storage and clears the avatarUrl from the profile.',
      security: [{ bearerAuth: [] }],
      response: {
        204: z.object({}).describe('Avatar removed'),
      },
    },

    handler: async (request, reply) => {
      const userId = request.user.sub;
      const tenantId = request.user.tenantId!;

      // Soft-delete the avatar file from storage
      const avatarFile = await prisma.storageFile.findFirst({
        where: {
          tenantId,
          entityType: 'user-avatar',
          entityId: userId,
          deletedAt: null,
        },
      });

      if (avatarFile) {
        await prisma.storageFile.update({
          where: { id: avatarFile.id },
          data: { deletedAt: new Date() },
        });
      }

      // Clear avatarUrl from profile
      await prisma.userProfile.updateMany({
        where: { userId },
        data: { avatarUrl: '' },
      });

      await logAudit(request, {
        message: AUDIT_MESSAGES.CORE.ME_PROFILE_CHANGE,
        entityId: userId,
        placeholders: { userName: userId },
        newData: { avatarUrl: '', operation: 'avatar-remove' },
      });

      return reply.status(204).send({});
    },
  });
}
