import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ForbiddenError } from '@/@errors/use-cases/forbidden-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { rateLimitConfig } from '@/config/rate-limits';
import { PermissionCodes } from '@/constants/rbac';
import { logger } from '@/lib/logger';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeDeleteEmailMessageUseCase } from '@/use-cases/email/messages/factories/make-delete-email-message-use-case';
import { makeDownloadEmailAttachmentUseCase } from '@/use-cases/email/messages/factories/make-get-email-attachment-download-url-use-case';
import { makeGetEmailMessageUseCase } from '@/use-cases/email/messages/factories/make-get-email-message-use-case';
import { makeListCentralInboxUseCase } from '@/use-cases/email/messages/factories/make-list-central-inbox-use-case';
import { makeListEmailMessagesUseCase } from '@/use-cases/email/messages/factories/make-list-email-messages-use-case';
import { makeMarkEmailMessageReadUseCase } from '@/use-cases/email/messages/factories/make-mark-email-message-read-use-case';
import { makeMoveEmailMessageUseCase } from '@/use-cases/email/messages/factories/make-move-email-message-use-case';
import { makeSaveEmailDraftUseCase } from '@/use-cases/email/messages/factories/make-save-email-draft-use-case';
import { makeSendEmailMessageUseCase } from '@/use-cases/email/messages/factories/make-send-email-message-use-case';
import { makeSuggestEmailContactsUseCase } from '@/use-cases/email/messages/factories/make-suggest-email-contacts-use-case';
import { makeToggleEmailMessageFlagUseCase } from '@/use-cases/email/messages/factories/make-toggle-email-message-flag-use-case';
import { queueEmailSync } from '@/workers/queues/email-sync.queue';
import rateLimit from '@fastify/rate-limit';
import '@fastify/multipart';
import type { FastifyInstance } from 'fastify';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

const messageSchema = z.object({
  id: z.string().uuid(),
  accountId: z.string().uuid(),
  folderId: z.string().uuid(),
  subject: z.string(),
  fromAddress: z.string(),
  fromName: z.string().nullable(),
  snippet: z.string().nullable(),
  receivedAt: z.coerce.date(),
  isRead: z.boolean(),
  isAnswered: z.boolean(),
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
  fromAddress: z.string(),
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
  isAnswered: z.boolean(),
  hasAttachments: z.boolean(),
  deletedAt: z.coerce.date().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  attachments: z.array(attachmentSchema).optional(),
});

/** Prevents CRLF header injection in email subject/fields */
const noLineBreaks = (val: string) => !val.includes('\r') && !val.includes('\n');

const _sendMessageBodySchema = z.object({
  accountId: z.string().uuid(),
  to: z.array(z.string().email()).min(1),
  cc: z.array(z.string().email()).optional(),
  bcc: z.array(z.string().email()).optional(),
  subject: z.string().min(1).refine(noLineBreaks, {
    message: 'Assunto não pode conter quebras de linha',
  }),
  bodyHtml: z.string().min(1),
  inReplyTo: z.string().optional(),
  references: z.array(z.string()).optional(),
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
  app.addHook('onRequest', createModuleMiddleware('EMAIL'));

  // Rate limit: email sending (30/min) - most expensive operation
  app.register(rateLimit, rateLimitConfig.emailSend);

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
        flagged: z.coerce.boolean().optional(),
        search: z.string().trim().min(2).max(128).optional(),
        cursor: z.string().min(1).optional(),
      }),
      response: {
        200: z.object({
          data: z.array(messageSchema),
          meta: z.object({
            total: z.number(),
            page: z.number(),
            limit: z.number(),
            pages: z.number(),
            nextCursor: z.string().nullable().optional(),
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
          flagged: request.query.flagged,
          search: request.query.search,
          page: request.query.page,
          limit: request.query.limit,
          cursor: request.query.cursor,
        });

        return reply.status(200).send({
          data: result.messages,
          meta: {
            total: result.total,
            page: result.page,
            limit: result.limit,
            pages: result.pages,
            nextCursor: result.nextCursor,
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
    url: '/v1/email/messages/central-inbox',
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
      summary: 'List central inbox messages (aggregated across accounts)',
      security: [{ bearerAuth: [] }],
      querystring: z.object({
        accountIds: z.string().transform((val) => val.split(',')).pipe(z.array(z.string().uuid()).min(1).max(20)),
        page: z.coerce.number().int().positive().default(1),
        limit: z.coerce.number().int().positive().max(100).default(50),
        unread: z.coerce.boolean().optional(),
        search: z.string().trim().min(2).max(128).optional(),
        cursor: z.string().min(1).optional(),
      }),
      response: {
        200: z.object({
          data: z.array(messageSchema),
          meta: z.object({
            total: z.number(),
            page: z.number(),
            limit: z.number(),
            pages: z.number(),
            nextCursor: z.string().nullable().optional(),
          }),
        }),
        403: z.object({ message: z.string() }),
      },
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const userId = request.user.sub;

      try {
        const useCase = makeListCentralInboxUseCase();
        const result = await useCase.execute({
          tenantId,
          userId,
          accountIds: request.query.accountIds,
          unread: request.query.unread,
          search: request.query.search,
          page: request.query.page,
          limit: request.query.limit,
          cursor: request.query.cursor,
        });

        return reply.status(200).send({
          data: result.messages,
          meta: {
            total: result.total,
            page: result.page,
            limit: result.limit,
            pages: result.pages,
            nextCursor: result.nextCursor,
          },
        });
      } catch (error) {
        if (error instanceof ForbiddenError) {
          return reply.status(403).send({ message: error.message });
        }
        throw error;
      }
    },
  });

  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/email/messages/contacts/suggest',
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
      summary: 'Suggest email contacts based on message history',
      security: [{ bearerAuth: [] }],
      querystring: z.object({
        q: z.string().trim().min(1).max(128),
        limit: z.coerce.number().int().positive().max(50).default(10),
      }),
      response: {
        200: z.object({
          contacts: z.array(
            z.object({
              email: z.string(),
              name: z.string().nullable(),
              frequency: z.number(),
            }),
          ),
        }),
      },
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const userId = request.user.sub;

      const useCase = makeSuggestEmailContactsUseCase();
      const result = await useCase.execute({
        tenantId,
        userId,
        query: request.query.q,
        limit: request.query.limit,
      });

      return reply.status(200).send(result);
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

        // Fire-and-forget: queue an email sync so the draft appears
        // in the local database (the use case only appends to IMAP).
        queueEmailSync({
          tenantId,
          accountId: request.body.accountId,
        }).catch((err) => {
          logger.warn(
            { err, accountId: request.body.accountId },
            '[SaveDraft] Failed to queue post-draft sync (non-critical)',
          );
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
          subject: z.string().min(1).refine(noLineBreaks, {
            message: 'Assunto não pode conter quebras de linha',
          }),
          bodyHtml: z.string().min(1),
          inReplyTo: z.string().optional(),
          references: z.array(z.string()).optional(),
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
          ...(parsed.data.inReplyTo
            ? { inReplyTo: parsed.data.inReplyTo }
            : {}),
          ...(parsed.data.references
            ? { references: parsed.data.references }
            : {}),
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
        const inReplyTo = getField('inReplyTo') || undefined;
        const referencesRaw = fields['references'];
        const references = referencesRaw
          ? Array.isArray(referencesRaw)
            ? referencesRaw
            : [referencesRaw]
          : undefined;

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
          inReplyTo,
          references: references?.length ? references : undefined,
        });

        logger.info(
          { messageId: result.messageId, to: getArrayField('to'), subject: getField('subject') },
          '[Email Send] Email sent successfully',
        );

        return reply.status(202).send(result);
      } catch (error) {
        logger.error(
          { err: error, accountId: getField('accountId'), to: getArrayField('to') },
          '[Email Send] Failed to send email',
        );
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

  // ── Toggle flag (star) ──────────────────────────────────────────────────
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PATCH',
    url: '/v1/email/messages/:id/flag',
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
      summary: 'Toggle flag/star on email message',
      security: [{ bearerAuth: [] }],
      params: z.object({ id: z.string().uuid() }),
      body: z.object({ isFlagged: z.boolean() }),
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
        const useCase = makeToggleEmailMessageFlagUseCase();
        await useCase.execute({
          tenantId,
          userId,
          messageId: request.params.id,
          isFlagged: request.body.isFlagged,
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
      summary: 'Download email attachment binary from IMAP on-demand',
      security: [{ bearerAuth: [] }],
      params: z.object({
        messageId: z.string().uuid(),
        attachmentId: z.string().uuid(),
      }),
      response: {
        403: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const userId = request.user.sub;

      try {
        const useCase = makeDownloadEmailAttachmentUseCase();
        const result = await useCase.execute({
          tenantId,
          userId,
          messageId: request.params.messageId,
          attachmentId: request.params.attachmentId,
        });

        // Encode filename for Content-Disposition (RFC 5987)
        const encodedFilename = encodeURIComponent(result.filename).replace(
          /[!'()*]/g,
          (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`,
        );
        const safeFilename = result.filename.replace(/["\\\r\n]/g, '_');

        // Binary response — reply.raw bypasses Zod type provider serialization
        // (Zod cannot express Buffer in response schemas) and also bypasses
        // Fastify hooks. We must set CORS headers manually using the real
        // request origin (not '*') because the frontend sends credentials.
        const origin = request.headers.origin;
        const headers: Record<string, string | number> = {
          'Content-Type': result.contentType,
          'Content-Disposition': `attachment; filename="${safeFilename}"; filename*=UTF-8''${encodedFilename}`,
          'Content-Length': result.size,
        };

        // Only set CORS headers when a browser Origin is present.
        // Never fall back to a hardcoded origin — that would break
        // production or introduce a CORS misconfiguration.
        if (origin) {
          headers['Access-Control-Allow-Origin'] = origin;
          headers['Access-Control-Allow-Credentials'] = 'true';
          headers['Access-Control-Expose-Headers'] = 'Content-Disposition';
        }

        reply.raw.writeHead(200, headers);
        reply.raw.end(result.content);
        return;
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
