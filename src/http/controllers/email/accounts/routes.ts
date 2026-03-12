import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ForbiddenError } from '@/@errors/use-cases/forbidden-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { rateLimitConfig } from '@/config/rate-limits';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { logger } from '@/lib/logger';
import { makeCreateEmailAccountUseCase } from '@/use-cases/email/accounts/factories/make-create-email-account-use-case';
import { makeDeleteEmailAccountUseCase } from '@/use-cases/email/accounts/factories/make-delete-email-account-use-case';
import { makeGetEmailAccountUseCase } from '@/use-cases/email/accounts/factories/make-get-email-account-use-case';
import { makeListEmailAccountsUseCase } from '@/use-cases/email/accounts/factories/make-list-email-accounts-use-case';
import { makeShareEmailAccountUseCase } from '@/use-cases/email/accounts/factories/make-share-email-account-use-case';
import { makeTestEmailConnectionUseCase } from '@/use-cases/email/accounts/factories/make-test-email-connection-use-case';
import { makeUnshareEmailAccountUseCase } from '@/use-cases/email/accounts/factories/make-unshare-email-account-use-case';
import { makeUpdateEmailAccountUseCase } from '@/use-cases/email/accounts/factories/make-update-email-account-use-case';
import { makeSyncEmailAccountUseCase } from '@/use-cases/email/sync/factories/make-sync-email-account-use-case';
import {
  isEmailHostObviouslySafe,
  isEmailPortValid,
} from '@/utils/security/validate-email-host';
import { queueEmailSync } from '@/workers/queues/email-sync.queue';
import rateLimit from '@fastify/rate-limit';
import type { FastifyInstance } from 'fastify';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

const emailAccountSchema = z.object({
  id: z.string().uuid(),
  address: z.string().email(),
  displayName: z.string().nullable(),
  imapHost: z.string(),
  imapPort: z.number(),
  imapSecure: z.boolean(),
  smtpHost: z.string(),
  smtpPort: z.number(),
  smtpSecure: z.boolean(),
  tlsVerify: z.boolean(),
  username: z.string(),
  visibility: z.enum(['PRIVATE', 'SHARED']),
  isActive: z.boolean(),
  isDefault: z.boolean(),
  signature: z.string().nullable(),
  lastSyncAt: z.coerce.date().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  teamId: z.string().uuid().nullable(),
  teamName: z.string().nullable(),
});

const emailHostSchema = z.string().min(1).refine(isEmailHostObviouslySafe, {
  message:
    'Endereço de host inválido ou bloqueado (IPs internos não são permitidos)',
});

const emailPortSchema = z.number().int().positive().refine(isEmailPortValid, {
  message:
    'Porta inválida. Portas permitidas: 25, 110, 143, 465, 587, 993, 995, 2525',
});

const createEmailAccountBodySchema = z.object({
  address: z.string().email(),
  displayName: z.string().max(128).optional(),
  imapHost: emailHostSchema,
  imapPort: emailPortSchema,
  imapSecure: z.boolean().default(true),
  smtpHost: emailHostSchema,
  smtpPort: emailPortSchema,
  smtpSecure: z.boolean().default(true),
  tlsVerify: z.boolean().default(false),
  username: z.string().min(1),
  secret: z.string().min(1),
  isDefault: z.boolean().optional(),
  visibility: z.enum(['PRIVATE', 'SHARED']).optional(),
  signature: z.string().nullable().optional(),
});

const updateEmailAccountBodySchema = createEmailAccountBodySchema
  .partial()
  .extend({
    signature: z.string().nullable().optional(),
    displayName: z.string().max(128).nullable().optional(),
  });

const shareEmailAccountBodySchema = z.object({
  userId: z.string().uuid(),
  canRead: z.boolean().default(true),
  canSend: z.boolean().default(false),
  canManage: z.boolean().default(false),
});

const emailAccountAccessSchema = z.object({
  id: z.string().uuid(),
  accountId: z.string().uuid(),
  tenantId: z.string().uuid(),
  userId: z.string().uuid(),
  canRead: z.boolean(),
  canSend: z.boolean(),
  canManage: z.boolean(),
  createdAt: z.coerce.date(),
});

const MANUAL_EMAIL_SYNC_DEDUP_WINDOW_MS = 30_000;

// In-memory throttle for inline sync when BullMQ is disabled

export async function emailAccountsRoutes(app: FastifyInstance) {
  app.addHook('onRequest', createModuleMiddleware('EMAIL'));

  // Rate limit all account endpoints (mutation-level: 100/min)
  app.register(rateLimit, rateLimitConfig.mutation);

  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/email/accounts',
    onRequest: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.EMAIL.ACCOUNTS.CREATE,
        resource: 'email-accounts',
      }),
    ],
    schema: {
      tags: ['Email - Accounts'],
      summary: 'Create email account',
      security: [{ bearerAuth: [] }],
      body: createEmailAccountBodySchema,
      response: {
        201: z.object({ account: emailAccountSchema }),
        400: z.object({ message: z.string() }),
      },
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const userId = request.user.sub;

      try {
        const useCase = makeCreateEmailAccountUseCase();
        const result = await useCase.execute({
          tenantId,
          userId,
          ...request.body,
        });

        return reply.status(201).send(result);
      } catch (error) {
        if (error instanceof BadRequestError) {
          return reply.status(400).send({ message: error.message });
        }
        throw error;
      }
    },
  });

  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/email/accounts',
    onRequest: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.EMAIL.ACCOUNTS.LIST,
        resource: 'email-accounts',
      }),
    ],
    schema: {
      tags: ['Email - Accounts'],
      summary: 'List visible email accounts',
      security: [{ bearerAuth: [] }],
      response: {
        200: z.object({ data: z.array(emailAccountSchema) }),
      },
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const userId = request.user.sub;

      const useCase = makeListEmailAccountsUseCase();
      const result = await useCase.execute({ tenantId, userId });

      return reply.status(200).send({ data: result.accounts });
    },
  });

  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/email/accounts/:id',
    onRequest: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.EMAIL.ACCOUNTS.READ,
        resource: 'email-accounts',
      }),
    ],
    schema: {
      tags: ['Email - Accounts'],
      summary: 'Get email account by id',
      security: [{ bearerAuth: [] }],
      params: z.object({ id: z.string().uuid() }),
      response: {
        200: z.object({ account: emailAccountSchema }),
        403: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const userId = request.user.sub;

      try {
        const useCase = makeGetEmailAccountUseCase();
        const result = await useCase.execute({
          tenantId,
          userId,
          accountId: request.params.id,
        });

        return reply.status(200).send(result);
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

  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PATCH',
    url: '/v1/email/accounts/:id',
    onRequest: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.EMAIL.ACCOUNTS.UPDATE,
        resource: 'email-accounts',
      }),
    ],
    schema: {
      tags: ['Email - Accounts'],
      summary: 'Update email account',
      security: [{ bearerAuth: [] }],
      params: z.object({ id: z.string().uuid() }),
      body: updateEmailAccountBodySchema,
      response: {
        200: z.object({ account: emailAccountSchema }),
        400: z.object({ message: z.string() }),
        403: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const userId = request.user.sub;

      try {
        const useCase = makeUpdateEmailAccountUseCase();
        const result = await useCase.execute({
          tenantId,
          userId,
          accountId: request.params.id,
          ...request.body,
        });

        return reply.status(200).send(result);
      } catch (error) {
        if (error instanceof BadRequestError) {
          return reply.status(400).send({ message: error.message });
        }
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

  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'DELETE',
    url: '/v1/email/accounts/:id',
    onRequest: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.EMAIL.ACCOUNTS.DELETE,
        resource: 'email-accounts',
      }),
    ],
    schema: {
      tags: ['Email - Accounts'],
      summary: 'Delete email account',
      security: [{ bearerAuth: [] }],
      params: z.object({ id: z.string().uuid() }),
      response: {
        204: z.null(),
        403: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const userId = request.user.sub;

      try {
        const useCase = makeDeleteEmailAccountUseCase();
        await useCase.execute({
          tenantId,
          userId,
          accountId: request.params.id,
        });

        return reply.status(204).send(null);
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

  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/email/accounts/:id/test',
    onRequest: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.EMAIL.ACCOUNTS.READ,
        resource: 'email-accounts',
      }),
    ],
    schema: {
      tags: ['Email - Accounts'],
      summary: 'Test email account connection',
      security: [{ bearerAuth: [] }],
      params: z.object({ id: z.string().uuid() }),
      response: {
        204: z.null(),
        400: z.object({ message: z.string() }),
        403: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const userId = request.user.sub;

      try {
        const useCase = makeTestEmailConnectionUseCase();
        await useCase.execute({
          tenantId,
          userId,
          accountId: request.params.id,
        });

        return reply.status(204).send(null);
      } catch (error) {
        if (error instanceof BadRequestError) {
          return reply.status(400).send({ message: error.message });
        }
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

  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/email/accounts/:id/sync',
    onRequest: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.EMAIL.SYNC.EXECUTE,
        resource: 'email-sync',
      }),
    ],
    schema: {
      tags: ['Email - Accounts'],
      summary: 'Trigger manual email synchronization',
      security: [{ bearerAuth: [] }],
      params: z.object({ id: z.string().uuid() }),
      response: {
        200: z.object({ message: z.string() }),
        202: z.object({ message: z.string() }),
        403: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const userId = request.user.sub;
      const accountId = request.params.id;

      try {
        const getAccount = makeGetEmailAccountUseCase();
        await getAccount.execute({ tenantId, userId, accountId });

        // Try BullMQ first (async, returns 202 immediately)
        try {
          const bucket = Math.floor(
            Date.now() / MANUAL_EMAIL_SYNC_DEDUP_WINDOW_MS,
          );
          const jobId = `manual-email-sync-${tenantId}-${accountId}-${bucket}`;

          const job = await queueEmailSync({ tenantId, accountId }, { jobId });
          logger.info(
            { jobId: job.id, tenantId, accountId },
            'Manual email sync enqueued',
          );

          return reply.status(202).send({
            message: 'Sincronização manual agendada.',
          });
        } catch (queueError) {
          // BullMQ/Redis unavailable — fall back to inline sync
          logger.warn(
            { err: queueError, tenantId, accountId },
            'BullMQ unavailable, falling back to inline sync',
          );

          const syncUseCase = makeSyncEmailAccountUseCase();
          const result = await syncUseCase.execute({ tenantId, accountId });

          logger.info(
            { tenantId, accountId, ...result },
            'Inline email sync completed',
          );

          return reply.status(200).send({
            message: `Sincronização concluída: ${result.syncedMessages} mensagens sincronizadas.`,
          });
        }
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

  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/email/accounts/:id/share',
    onRequest: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.EMAIL.ACCOUNTS.SHARE,
        resource: 'email-accounts',
      }),
    ],
    schema: {
      tags: ['Email - Accounts'],
      summary: 'Share account with tenant user',
      security: [{ bearerAuth: [] }],
      params: z.object({ id: z.string().uuid() }),
      body: shareEmailAccountBodySchema,
      response: {
        201: z.object({ access: emailAccountAccessSchema }),
        400: z.object({ message: z.string() }),
        403: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const userId = request.user.sub;
      const accountId = request.params.id;

      try {
        const useCase = makeShareEmailAccountUseCase();
        const result = await useCase.execute({
          tenantId,
          userId,
          accountId,
          targetUserId: request.body.userId,
          canRead: request.body.canRead,
          canSend: request.body.canSend,
          canManage: request.body.canManage,
        });

        return reply.status(201).send(result);
      } catch (error) {
        if (error instanceof BadRequestError) {
          return reply.status(400).send({ message: error.message });
        }
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        if (error instanceof ForbiddenError) {
          return reply.status(403).send({ message: error.message });
        }
        if ((error as { code?: string }).code === 'P2003') {
          return reply.status(404).send({ message: 'User not found' });
        }
        throw error;
      }
    },
  });

  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'DELETE',
    url: '/v1/email/accounts/:id/share/:userId',
    onRequest: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.EMAIL.ACCOUNTS.SHARE,
        resource: 'email-accounts',
      }),
    ],
    schema: {
      tags: ['Email - Accounts'],
      summary: 'Remove account share for tenant user',
      security: [{ bearerAuth: [] }],
      params: z.object({
        id: z.string().uuid(),
        userId: z.string().uuid(),
      }),
      response: {
        204: z.null(),
        403: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const userId = request.user.sub;
      const accountId = request.params.id;
      const targetUserId = request.params.userId;

      try {
        const useCase = makeUnshareEmailAccountUseCase();
        await useCase.execute({
          tenantId,
          userId,
          accountId,
          targetUserId,
        });

        return reply.status(204).send(null);
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
