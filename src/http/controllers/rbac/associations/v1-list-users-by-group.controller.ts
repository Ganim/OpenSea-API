import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { idSchema } from '@/http/schemas/common.schema';
import { listUsersByGroupQuerySchema } from '@/http/schemas/rbac.schema';
import { makeListUsersByGroupUseCase } from '@/use-cases/rbac/factories';
import { prisma } from '@/lib/prisma';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

const userInGroupSchema = z.object({
  id: z.string(),
  email: z.string(),
  username: z.string(),
  assignedAt: z.coerce.date(),
  expiresAt: z.coerce.date().nullable(),
});

export async function listUsersByGroupController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/rbac/permission-groups/:groupId/users',
    preHandler: [
      verifyJwt,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.RBAC.ASSOCIATIONS.READ,
        resource: 'associations',
      }),
    ],
    schema: {
      tags: ['RBAC - Associations'],
      summary: 'List users in a permission group',
      params: z.object({
        groupId: idSchema,
      }),
      querystring: listUsersByGroupQuerySchema,
      response: {
        200: z.object({
          users: z.array(userInGroupSchema),
          userIds: z.array(z.string()),
        }),
        404: z.object({
          message: z.string(),
        }),
      },
    },

    handler: async (request, reply) => {
      const { groupId } = request.params;
      const { includeExpired } = request.query;
      const tenantId = request.user.tenantId;

      try {
        const listUsersByGroupUseCase = makeListUsersByGroupUseCase();

        const { userIds } = await listUsersByGroupUseCase.execute({
          groupId,
          includeExpired,
          tenantId,
        });

        if (userIds.length === 0) {
          return reply.status(200).send({ users: [], userIds: [] });
        }

        // Batch-fetch user details in a single query
        const userRecords = await prisma.user.findMany({
          where: {
            id: { in: userIds },
            deletedAt: null,
          },
          select: {
            id: true,
            email: true,
            username: true,
          },
        });

        const userMap = new Map(userRecords.map((u) => [u.id, u]));

        // Fetch assignment dates
        const now = new Date();
        const assignments = await prisma.userPermissionGroup.findMany({
          where: {
            groupId,
            userId: { in: userIds },
            ...(includeExpired
              ? {}
              : { OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] }),
          },
          select: {
            userId: true,
            createdAt: true,
            expiresAt: true,
          },
        });

        const assignmentMap = new Map(assignments.map((a) => [a.userId, a]));

        const users = userIds
          .map((id) => {
            const user = userMap.get(id);
            const assignment = assignmentMap.get(id);
            if (!user) return null;
            return {
              id: user.id,
              email: user.email,
              username: user.username ?? user.email,
              assignedAt: assignment?.createdAt ?? new Date(),
              expiresAt: assignment?.expiresAt ?? null,
            };
          })
          .filter((u) => u !== null);

        return reply.status(200).send({ users, userIds });
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
