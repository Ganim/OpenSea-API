import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ForbiddenError } from '@/@errors/use-cases/forbidden-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeDeleteEmailMessageUseCase } from '@/use-cases/email/messages/factories/make-delete-email-message-use-case';
import { makeGetEmailAttachmentDownloadUrlUseCase } from '@/use-cases/email/messages/factories/make-get-email-attachment-download-url-use-case';
import { makeGetEmailMessageUseCase } from '@/use-cases/email/messages/factories/make-get-email-message-use-case';
import { makeListEmailMessagesUseCase } from '@/use-cases/email/messages/factories/make-list-email-messages-use-case';
import { makeMarkEmailMessageReadUseCase } from '@/use-cases/email/messages/factories/make-mark-email-message-read-use-case';
import { makeMoveEmailMessageUseCase } from '@/use-cases/email/messages/factories/make-move-email-message-use-case';
import { makeSaveEmailDraftUseCase } from '@/use-cases/email/messages/factories/make-save-email-draft-use-case';
import { makeSendEmailMessageUseCase } from '@/use-cases/email/messages/factories/make-send-email-message-use-case';
import '@fastify/multipart';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

const messageSchema = z.object({
  id: z.string().uuid(),
  accountId: z.string().uuid(),
  folderId: z.string().uuid(),
  subject: z.string(),
  fromAddress: z.string().email(),
  fromName: z.string().nullable(),
  snippet: z.string().nullable(),
  receivedAt: z.coerce.date(),
  isRead: z.boolean(),
  hasAttachments: z.boolean(),
});

const attachmentSchema = z.object({
  id: z.string().uuid(),
  messageId: z.string().uuid(),
  filename: z.string(),
  contentType: z.string(),
  size: z.number(),
  storageKey: z.string(),
  createdAt: z.coerce.date(),
});

const messageDetailSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  accountId: z.string().uuid(),
  folderId: z.string().uuid(),
  remoteUid: z.number(),
  messageId: z.string().nullable(),
  threadId: z.string().nullable(),
  fromAddress: z.string().email(),
  fromName: z.string().nullable(),
  toAddresses: z.array(z.string()),
  ccAddresses: z.array(z.string()),
  bccAddresses: z.array(z.string()),
  subject: z.string(),
  snippet: z.string().nullable(),
  bodyText: z.string().nullable(),
  bodyHtmlSanitized: z.string().nullable(),
  receivedAt: z.coerce.date(),
  sentAt: z.coerce.date().nullable(),
  isRead: z.boolean(),
  isFlagged: z.boolean(),
  hasAttachments: z.boolean(),
  deletedAt: z.coerce.date().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  attachments: z.array(attachmentSchema).optional(),
});

const _sendMessageBodySchema = z.object({
  accountId: z.string().uuid(),
  to: z.array(z.string().email()).min(1),
  cc: z.array(z.string().email()).optional(),
  bcc: z.array(z.string().email()).optional(),
  subject: z.string().min(1),
  bodyHtml: z.string().min(1),
});

const saveDraftBodySchema = z.object({
  accountId: z.string().uuid(),
  to: z.array(z.string().email()).optional(),
  cc: z.array(z.string().email()).optional(),
  bcc: z.array(z.string().email()).optional(),
  subject: z.string().optional(),
  bodyHtml: z.string().optional(),
});

export async function emailMessagesRoutes(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/email/messages',
    onRequest: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.EMAIL.MESSAGES.LIST,
        resource: 'email-messages',
      }),
    ],
    schema: {
      tags: ['Email - Messages'],
      summary: 'List email messages',
      security: [{ bearerAuth: [] }],
      querystring: z.object({
        accountId: z.string().uuid(),
        folderId: z.string().uuid().optional(),
        page: z.coerce.number().int().positive().default(1),
        limit: z.coerce.number().int().positive().max(100).default(20),
        unread: z.coerce.boolean().optional(),
        search: z.string().trim().min(2).max(128).optional(),
      }),
      response: {
        200: z.object({
          data: z.array(messageSchema),
          meta: z.object({
            total: z.number(),
            page: z.number(),
            limit: z.number(),
            pages: z.number(),
          }),
        }),
        404: z.object({ message: z.string() }),
        403: z.object({ message: z.string() }),
      },
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const userId = request.user.sub;

      try {
        const useCase = makeListEmailMessagesUseCase();
        const result = await useCase.execute({
          tenantId,
          userId,
          accountId: request.query.accountId,
          folderId: request.query.folderId,
          unread: request.query.unread,
          search: request.query.search,
          page: request.query.page,
          limit: request.query.limit,
        });

        return reply.status(200).send({
          data: result.messages,
          meta: {
            total: result.total,
            page: result.page,
            limit: result.limit,
            pages: result.pages,
          },
        });
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
    method: 'GET',
    url: '/v1/email/messages/:id',
    onRequest: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.EMAIL.MESSAGES.READ,
        resource: 'email-messages',
      }),
    ],
    schema: {
      tags: ['Email - Messages'],
      summary: 'Get email message by id',
      security: [{ bearerAuth: [] }],
      params: z.object({ id: z.string().uuid() }),
      response: {
        200: z.object({ message: messageDetailSchema }),
        403: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const userId = request.user.sub;

      try {
        const useCase = makeGetEmailMessageUseCase();
        const result = await useCase.execute({
          tenantId,
          userId,
          messageId: request.params.id,
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
    method: 'POST',
    url: '/v1/email/messages/draft',
    onRequest: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.EMAIL.MESSAGES.SEND,
        resource: 'email-messages',
      }),
    ],
    schema: {
      tags: ['Email - Messages'],
      summary: 'Save email draft',
      security: [{ bearerAuth: [] }],
      body: saveDraftBodySchema,
      response: {
        201: z.object({ draftId: z.string() }),
        400: z.object({ message: z.string() }),
        403: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const userId = request.user.sub;

      try {
        const useCase = makeSaveEmailDraftUseCase();
        const result = await useCase.execute({
          tenantId,
          userId,
          accountId: request.body.accountId,
          to: request.body.to,
          cc: request.body.cc,
          bcc: request.body.bcc,
          subject: request.body.subject,
          bodyHtml: request.body.bodyHtml,
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
        throw error;
      }
    },
  });

  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/email/messages/send',
    onRequest: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.EMAIL.MESSAGES.SEND,
        resource: 'email-messages',
      }),
    ],
    schema: {
      tags: ['Email - Messages'],
      summary:
        'Send email message (JSON or multipart/form-data with attachments)',
      security: [{ bearerAuth: [] }],
      response: {
        202: z.object({ messageId: z.string() }),
        400: z.object({ message: z.string() }),
        403: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const userId = request.user.sub;

      let fields: Record<string, string | string[]> = {};
      const attachments: {
        filename: string;
        content: Buffer;
        contentType: string;
      }[] = [];

      if (request.isMultipart()) {
        // Parse multipart/form-data (suporta anexos)
        const parts = request.parts();
        for await (const part of parts) {
          if (part.type === 'file') {
            const buffer = await part.toBuffer();
            attachments.push({
              filename: part.filename,
              content: buffer,
              contentType: part.mimetype,
            });
          } else {
            const existing = fields[part.fieldname];
            if (existing !== undefined) {
              fields[part.fieldname] = Array.isArray(existing)
                ? [...existing, part.value as string]
                : [existing, part.value as string];
            } else {
              fields[part.fieldname] = part.value as string;
            }
          }
        }
      } else {
        // Parse JSON body (sem anexos)
        const sendBodySchema = z.object({
          accountId: z.string().uuid(),
          to: z.array(z.string().email()).min(1),
          cc: z.array(z.string().email()).optional(),
          bcc: z.array(z.string().email()).optional(),
          subject: z.string().min(1),
          bodyHtml: z.string().min(1),
        });
        const parsed = sendBodySchema.safeParse(request.body);
        if (!parsed.success) {
          const firstError =
            parsed.error?.issues?.[0]?.message ?? 'Invalid request body';
          return reply.status(400).send({ message: firstError });
        }
        fields = {
          accountId: parsed.data.accountId,
          to: parsed.data.to,
          subject: parsed.data.subject,
          bodyHtml: parsed.data.bodyHtml,
          ...(parsed.data.cc ? { cc: parsed.data.cc } : {}),
          ...(parsed.data.bcc ? { bcc: parsed.data.bcc } : {}),
        };
      }

      const getField = (name: string): string => {
        const val = fields[name];
        return Array.isArray(val) ? val[0] : (val ?? '');
      };
      const getArrayField = (name: string): string[] => {
        const val = fields[name];
        if (!val) return [];
        return Array.isArray(val) ? val : [val];
      };

      try {
        const useCase = makeSendEmailMessageUseCase();
        const result = await useCase.execute({
          tenantId,
          userId,
          accountId: getField('accountId'),
          to: getArrayField('to'),
          cc: getArrayField('cc').length ? getArrayField('cc') : undefined,
          bcc: getArrayField('bcc').length ? getArrayField('bcc') : undefined,
          subject: getField('subject'),
          bodyHtml: getField('bodyHtml'),
          attachments: attachments.length ? attachments : undefined,
        });

        return reply.status(202).send(result);
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
    method: 'PATCH',
    url: '/v1/email/messages/:id/read',
    onRequest: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.EMAIL.MESSAGES.UPDATE,
        resource: 'email-messages',
      }),
    ],
    schema: {
      tags: ['Email - Messages'],
      summary: 'Mark email message as read/unread',
      security: [{ bearerAuth: [] }],
      params: z.object({ id: z.string().uuid() }),
      body: z.object({ isRead: z.boolean() }),
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
        const useCase = makeMarkEmailMessageReadUseCase();
        await useCase.execute({
          tenantId,
          userId,
          messageId: request.params.id,
          isRead: request.body.isRead,
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
    method: 'PATCH',
    url: '/v1/email/messages/:id/move',
    onRequest: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.EMAIL.MESSAGES.UPDATE,
        resource: 'email-messages',
      }),
    ],
    schema: {
      tags: ['Email - Messages'],
      summary: 'Move email message to another folder',
      security: [{ bearerAuth: [] }],
      params: z.object({ id: z.string().uuid() }),
      body: z.object({ targetFolderId: z.string().uuid() }),
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
        const useCase = makeMoveEmailMessageUseCase();
        await useCase.execute({
          tenantId,
          userId,
          messageId: request.params.id,
          targetFolderId: request.body.targetFolderId,
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
    method: 'DELETE',
    url: '/v1/email/messages/:id',
    onRequest: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.EMAIL.MESSAGES.DELETE,
        resource: 'email-messages',
      }),
    ],
    schema: {
      tags: ['Email - Messages'],
      summary: 'Delete email message',
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
        const useCase = makeDeleteEmailMessageUseCase();
        await useCase.execute({
          tenantId,
          userId,
          messageId: request.params.id,
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
    method: 'GET',
    url: '/v1/email/messages/:messageId/attachments/:attachmentId/download',
    onRequest: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.EMAIL.MESSAGES.READ,
        resource: 'email-messages',
      }),
    ],
    schema: {
      tags: ['Email - Messages'],
      summary: 'Get presigned download URL for an email attachment',
      security: [{ bearerAuth: [] }],
      params: z.object({
        messageId: z.string().uuid(),
        attachmentId: z.string().uuid(),
      }),
      response: {
        200: z.object({
          url: z.string(),
          filename: z.string(),
          contentType: z.string(),
        }),
        403: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const userId = request.user.sub;

      try {
        const useCase = makeGetEmailAttachmentDownloadUrlUseCase();
        const result = await useCase.execute({
          tenantId,
          userId,
          messageId: request.params.messageId,
          attachmentId: request.params.attachmentId,
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
}
