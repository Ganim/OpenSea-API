import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { PermissionGroupSlugs } from '@/constants/rbac/permission-groups';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  createUserSchema,
  userProfileSchema,
  userResponseSchema,
} from '@/http/schemas';
import { prisma } from '@/lib/prisma';
import { PrismaTenantUsersRepository } from '@/repositories/core/prisma/prisma-tenant-users-repository';
import { makeCreateUserUseCase } from '@/use-cases/core/users/factories/make-create-user-use-case';
import { makeGetUserByIdUseCase } from '@/use-cases/core/users/factories/make-get-user-by-id-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

const createUserBodySchema = createUserSchema.extend({
  profile: userProfileSchema.optional(),
});

export async function createUserController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/users',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.CORE.USERS.CREATE,
        resource: 'users',
      }),
    ],
    schema: {
      tags: ['Auth - Users'],
      summary: 'Create a new user',
      description:
        'Create user with strong password requirements (8+ chars, uppercase, lowercase, number, special character)',
      body: createUserBodySchema,
      response: {
        201: z.object({
          user: userResponseSchema,
        }),
        400: z.object({
          message: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const { email, password, username, profile } = request.body;
      const adminId = request.user.sub;
      const tenantId = request.user.tenantId!;

      try {
        // Busca nome do admin para auditoria
        const getUserByIdUseCase = makeGetUserByIdUseCase();
        const { user: admin } = await getUserByIdUseCase.execute({
          userId: adminId,
        });
        const adminName = admin.profile?.name
          ? `${admin.profile.name} ${admin.profile.surname || ''}`.trim()
          : admin.username || admin.email;

        const createUserUseCase = makeCreateUserUseCase();
        const { user } = await createUserUseCase.execute({
          email,
          password,
          username,
          profile,
        });

        // Associate user with the current tenant
        const tenantUsersRepository = new PrismaTenantUsersRepository();
        await tenantUsersRepository.create({
          tenantId: new UniqueEntityID(tenantId),
          userId: new UniqueEntityID(user.id),
          role: 'member',
        });

        // Auto-assign to tenant's "Usuário" permission group
        // Try tenant-specific slug first (new format), then fall back to bare slug (legacy)
        let tenantUserGroup = await prisma.permissionGroup.findFirst({
          where: {
            slug: `${PermissionGroupSlugs.USER}-${tenantId.substring(0, 8)}`,
            tenantId,
            deletedAt: null,
          },
        });
        if (!tenantUserGroup) {
          tenantUserGroup = await prisma.permissionGroup.findFirst({
            where: {
              slug: PermissionGroupSlugs.USER,
              tenantId,
              deletedAt: null,
            },
          });
        }

        if (tenantUserGroup) {
          await prisma.userPermissionGroup.create({
            data: {
              userId: user.id.toString(),
              groupId: tenantUserGroup.id,
              grantedBy: adminId,
            },
          });
        }

        // Log de auditoria
        const userName = user.profile?.name
          ? `${user.profile.name} ${user.profile.surname || ''}`.trim()
          : user.username || user.email;

        await logAudit(request, {
          message: AUDIT_MESSAGES.CORE.USER_CREATE,
          entityId: user.id.toString(),
          placeholders: { adminName, userName },
          newData: { email, username, profile },
          affectedUserId: user.id.toString(),
        });

        return reply.status(201).send({ user });
      } catch (error) {
        if (error instanceof BadRequestError) {
          return reply.status(400).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
