import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { folderAccessRuleResponseSchema } from '@/http/schemas/storage';
import { folderAccessRuleToDTO } from '@/mappers/storage';
import { makeListFolderAccessUseCase } from '@/use-cases/storage/access/factories/make-list-folder-access-use-case';
import { prisma } from '@/lib/prisma';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function listFolderAccessController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/storage/folders/:id/access',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.TOOLS.STORAGE_FILES.ACCESS,
        resource: 'storage-access',
      }),
    ],
    schema: {
      tags: ['Storage - Access'],
      summary: 'List access rules for a folder',
      params: z.object({
        id: z.string().uuid(),
      }),
      response: {
        200: z.object({
          rules: z.array(folderAccessRuleResponseSchema),
        }),
        404: z.object({
          message: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { id: folderId } = request.params;

      try {
        const listFolderAccessUseCase = makeListFolderAccessUseCase();
        const { rules } = await listFolderAccessUseCase.execute({
          tenantId,
          folderId,
        });

        // Resolve user/group/team names for display
        const userIds = rules
          .map((r) => r.userId?.toString())
          .filter(Boolean) as string[];
        const groupIds = rules
          .map((r) => r.groupId?.toString())
          .filter(Boolean) as string[];
        const teamIds = rules
          .map((r) => r.teamId?.toString())
          .filter(Boolean) as string[];

        const [users, groups, teams] = await Promise.all([
          userIds.length > 0
            ? prisma.user.findMany({
                where: { id: { in: userIds } },
                select: { id: true, username: true },
              })
            : [],
          groupIds.length > 0
            ? prisma.permissionGroup.findMany({
                where: { id: { in: groupIds } },
                select: { id: true, name: true },
              })
            : [],
          teamIds.length > 0
            ? prisma.team.findMany({
                where: { id: { in: teamIds } },
                select: { id: true, name: true },
              })
            : [],
        ]);

        const userMap = new Map(users.map((u) => [u.id, u.username]));
        const groupMap = new Map(groups.map((g) => [g.id, g.name]));
        const teamMap = new Map(teams.map((t) => [t.id, t.name]));

        return reply.status(200).send({
          rules: rules.map((rule) =>
            folderAccessRuleToDTO(rule, {
              userName: rule.userId
                ? (userMap.get(rule.userId.toString()) ?? null)
                : null,
              groupName: rule.groupId
                ? (groupMap.get(rule.groupId.toString()) ?? null)
                : null,
              teamName: rule.teamId
                ? (teamMap.get(rule.teamId.toString()) ?? null)
                : null,
            }),
          ),
        });
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
