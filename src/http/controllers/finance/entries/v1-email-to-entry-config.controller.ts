import { ErrorCodes } from '@/@errors/error-codes';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { errorResponseSchema } from '@/http/schemas/common/error-response.schema';
import {
  upsertEmailToEntryConfigSchema,
  emailToEntryConfigResponseSchema,
} from '@/http/schemas/finance';
import { prisma } from '@/lib/prisma';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function emailToEntryConfigController(app: FastifyInstance) {
  // GET — fetch current config
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/finance/email-to-entry/config',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.FINANCE.ENTRIES.ADMIN,
        resource: 'entries',
      }),
    ],
    schema: {
      tags: ['Finance - Email to Entry'],
      summary: 'Obter configuração de importação automática de e-mails',
      security: [{ bearerAuth: [] }],
      response: {
        200: z.object({ config: emailToEntryConfigResponseSchema.nullable() }),
      },
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;

      const config = await prisma.emailToEntryConfig.findUnique({
        where: { tenantId },
      });

      return reply.status(200).send({ config });
    },
  });

  // POST — create or update config
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/finance/email-to-entry/config',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.FINANCE.ENTRIES.ADMIN,
        resource: 'entries',
      }),
    ],
    schema: {
      tags: ['Finance - Email to Entry'],
      summary:
        'Criar ou atualizar configuração de importação automática de e-mails',
      security: [{ bearerAuth: [] }],
      body: upsertEmailToEntryConfigSchema,
      response: {
        200: z.object({ config: emailToEntryConfigResponseSchema }),
        400: errorResponseSchema,
      },
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const body = request.body;

      // Validate email account belongs to tenant
      const account = await prisma.emailAccount.findFirst({
        where: { id: body.emailAccountId, tenantId },
      });

      if (!account) {
        return reply.status(400).send({
          code: ErrorCodes.BAD_REQUEST,
          message: 'Conta de e-mail não encontrada.',
          requestId: request.requestId,
        });
      }

      // Validate category if provided
      if (body.defaultCategoryId) {
        const category = await prisma.financeCategory.findFirst({
          where: { id: body.defaultCategoryId, tenantId },
        });

        if (!category) {
          return reply.status(400).send({
            code: ErrorCodes.BAD_REQUEST,
            message: 'Categoria financeira não encontrada.',
            requestId: request.requestId,
          });
        }
      }

      const config = await prisma.emailToEntryConfig.upsert({
        where: { tenantId },
        create: {
          tenantId,
          emailAccountId: body.emailAccountId,
          monitoredFolder: body.monitoredFolder,
          isActive: body.isActive,
          autoCreate: body.autoCreate,
          defaultType: body.defaultType,
          defaultCategoryId: body.defaultCategoryId ?? null,
        },
        update: {
          emailAccountId: body.emailAccountId,
          monitoredFolder: body.monitoredFolder,
          isActive: body.isActive,
          autoCreate: body.autoCreate,
          defaultType: body.defaultType,
          defaultCategoryId: body.defaultCategoryId ?? null,
        },
      });

      return reply.status(200).send({ config });
    },
  });
}
