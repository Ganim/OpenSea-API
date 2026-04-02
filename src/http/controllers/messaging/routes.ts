import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';
import {
  contactIdParamsSchema,
  createMessagingAccountBodySchema,
  listContactsQuerySchema,
  listMessagesQuerySchema,
  messagingAccountResponseSchema,
  messagingContactResponseSchema,
  messagingMessageResponseSchema,
  paginationMetaSchema,
  sendMessageBodySchema,
} from '@/http/schemas/messaging/messaging.schema';
import { makeCreateMessagingAccountUseCase } from '@/use-cases/messaging/accounts/factories/make-create-messaging-account-use-case';
import { makeListMessagingAccountsUseCase } from '@/use-cases/messaging/accounts/factories/make-list-messaging-accounts-use-case';
import { makeListContactsUseCase } from '@/use-cases/messaging/contacts/factories/make-list-contacts-use-case';
import { makeListMessagesUseCase } from '@/use-cases/messaging/messages/factories/make-list-messages-use-case';
import { makeSendMessageUseCase } from '@/use-cases/messaging/messages/factories/make-send-message-use-case';
import { makeReceiveWebhookUseCase } from '@/use-cases/messaging/webhooks/factories/make-receive-webhook-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import {
  presentMessagingAccount,
  presentMessagingContact,
  presentMessagingMessage,
} from './presenters';

export async function messagingRoutes(app: FastifyInstance) {
  // ── Authenticated routes (require JWT + tenant + module) ──────────────────

  // POST /v1/messaging/accounts — Create messaging account
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/messaging/accounts',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createModuleMiddleware('MESSAGING'),
      createPermissionMiddleware({
        permissionCode: PermissionCodes.TOOLS.MESSAGING.ACCOUNTS.REGISTER,
        resource: 'messaging-accounts',
      }),
    ],
    schema: {
      tags: ['Messaging - Accounts'],
      summary: 'Create messaging account',
      security: [{ bearerAuth: [] }],
      body: createMessagingAccountBodySchema,
      response: {
        201: z.object({ account: messagingAccountResponseSchema }),
        400: z.object({ message: z.string() }),
      },
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;

      try {
        const useCase = makeCreateMessagingAccountUseCase();
        const { messagingAccount } = await useCase.execute({
          tenantId,
          ...request.body,
        });

        return reply
          .status(201)
          .send({ account: presentMessagingAccount(messagingAccount) });
      } catch (error) {
        if (error instanceof BadRequestError) {
          return reply.status(400).send({ message: error.message });
        }
        throw error;
      }
    },
  });

  // GET /v1/messaging/accounts — List messaging accounts
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/messaging/accounts',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createModuleMiddleware('MESSAGING'),
      createPermissionMiddleware({
        permissionCode: PermissionCodes.TOOLS.MESSAGING.ACCOUNTS.ACCESS,
        resource: 'messaging-accounts',
      }),
    ],
    schema: {
      tags: ['Messaging - Accounts'],
      summary: 'List messaging accounts for tenant',
      security: [{ bearerAuth: [] }],
      response: {
        200: z.object({
          data: z.array(messagingAccountResponseSchema),
        }),
      },
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;

      const useCase = makeListMessagingAccountsUseCase();
      const { messagingAccounts } = await useCase.execute({ tenantId });

      return reply.status(200).send({
        data: messagingAccounts.map(presentMessagingAccount),
      });
    },
  });

  // GET /v1/messaging/contacts — List contacts (paginated)
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/messaging/contacts',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createModuleMiddleware('MESSAGING'),
      createPermissionMiddleware({
        permissionCode: PermissionCodes.TOOLS.MESSAGING.CONTACTS.ACCESS,
        resource: 'messaging-contacts',
      }),
    ],
    schema: {
      tags: ['Messaging - Contacts'],
      summary: 'List messaging contacts',
      security: [{ bearerAuth: [] }],
      querystring: listContactsQuerySchema,
      response: {
        200: z.object({
          data: z.array(messagingContactResponseSchema),
          meta: paginationMetaSchema,
        }),
      },
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { page, limit, channel, search } = request.query;

      const useCase = makeListContactsUseCase();
      const { contacts, total } = await useCase.execute({
        tenantId,
        page,
        limit,
        channel,
        search,
      });

      return reply.status(200).send({
        data: contacts.map(presentMessagingContact),
        meta: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit),
        },
      });
    },
  });

  // GET /v1/messaging/contacts/:contactId/messages — List messages for a contact
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/messaging/contacts/:contactId/messages',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createModuleMiddleware('MESSAGING'),
      createPermissionMiddleware({
        permissionCode: PermissionCodes.TOOLS.MESSAGING.MESSAGES.ACCESS,
        resource: 'messaging-messages',
      }),
    ],
    schema: {
      tags: ['Messaging - Messages'],
      summary: 'List messages for a contact',
      security: [{ bearerAuth: [] }],
      params: contactIdParamsSchema,
      querystring: listMessagesQuerySchema,
      response: {
        200: z.object({
          data: z.array(messagingMessageResponseSchema),
          meta: paginationMetaSchema,
        }),
        404: z.object({ message: z.string() }),
      },
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { contactId } = request.params;
      const { page, limit } = request.query;

      try {
        const useCase = makeListMessagesUseCase();
        const { messages, total } = await useCase.execute({
          tenantId,
          contactId,
          page,
          limit,
        });

        return reply.status(200).send({
          data: messages.map(presentMessagingMessage),
          meta: {
            total,
            page,
            limit,
            pages: Math.ceil(total / limit),
          },
        });
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });

  // POST /v1/messaging/messages — Send message
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/messaging/messages',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createModuleMiddleware('MESSAGING'),
      createPermissionMiddleware({
        permissionCode: PermissionCodes.TOOLS.MESSAGING.MESSAGES.REGISTER,
        resource: 'messaging-messages',
      }),
    ],
    schema: {
      tags: ['Messaging - Messages'],
      summary: 'Send a message',
      security: [{ bearerAuth: [] }],
      body: sendMessageBodySchema,
      response: {
        201: z.object({ message: messagingMessageResponseSchema }),
        400: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;

      try {
        const useCase = makeSendMessageUseCase();
        const body = request.body;
        const { message: sentMessage } = await useCase.execute({
          tenantId,
          accountId: body.accountId,
          contactId: body.contactId,
          text: body.text,
          mediaUrl: body.mediaUrl,
          mediaType: body.mediaType,
          fileName: body.fileName,
          templateName: body.templateName,
          templateParams: body.templateParams as
            | Record<string, string>
            | undefined,
          replyToMessageId: body.replyToMessageId,
        });

        return reply
          .status(201)
          .send({ message: presentMessagingMessage(sentMessage) });
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

  // ── Webhook routes (PUBLIC — no auth middleware) ──────────────────────────

  // POST /v1/webhooks/whatsapp — WhatsApp webhook (Evolution API)
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/webhooks/whatsapp',
    schema: {
      tags: ['Messaging - Webhooks'],
      summary: 'WhatsApp webhook (Evolution API)',
      body: z.unknown(),
      response: {
        200: z.object({ status: z.string() }),
        400: z.object({ message: z.string() }),
      },
    },
    handler: async (request, reply) => {
      const signature =
        (request.headers['x-webhook-signature'] as string) ?? '';
      const accountId = (request.headers['x-account-id'] as string) ?? '';

      if (!accountId) {
        return reply
          .status(400)
          .send({ message: 'Missing x-account-id header' });
      }

      try {
        const useCase = makeReceiveWebhookUseCase('WHATSAPP');
        await useCase.execute({
          channel: 'WHATSAPP',
          accountId,
          rawPayload: request.body,
          signature,
        });

        return reply.status(200).send({ status: 'ok' });
      } catch (error) {
        if (error instanceof BadRequestError) {
          return reply.status(400).send({ message: error.message });
        }
        throw error;
      }
    },
  });

  // POST /v1/webhooks/instagram — Instagram webhook (Meta Graph API)
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/webhooks/instagram',
    schema: {
      tags: ['Messaging - Webhooks'],
      summary: 'Instagram webhook (Meta Graph API)',
      body: z.unknown(),
      response: {
        200: z.object({ status: z.string() }),
        400: z.object({ message: z.string() }),
      },
    },
    handler: async (request, reply) => {
      const signature =
        (request.headers['x-hub-signature-256'] as string) ?? '';
      const accountId = (request.headers['x-account-id'] as string) ?? '';

      if (!accountId) {
        return reply
          .status(400)
          .send({ message: 'Missing x-account-id header' });
      }

      try {
        const useCase = makeReceiveWebhookUseCase('INSTAGRAM');
        await useCase.execute({
          channel: 'INSTAGRAM',
          accountId,
          rawPayload: request.body,
          signature,
        });

        return reply.status(200).send({ status: 'ok' });
      } catch (error) {
        if (error instanceof BadRequestError) {
          return reply.status(400).send({ message: error.message });
        }
        throw error;
      }
    },
  });

  // GET /v1/webhooks/instagram — Instagram webhook verification (Meta challenge)
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/webhooks/instagram',
    schema: {
      tags: ['Messaging - Webhooks'],
      summary: 'Instagram webhook verification (Meta challenge)',
      querystring: z.object({
        'hub.mode': z.string(),
        'hub.verify_token': z.string(),
        'hub.challenge': z.string(),
      }),
      response: {
        200: z.string(),
        403: z.object({ message: z.string() }),
      },
    },
    handler: async (request, reply) => {
      const mode = request.query['hub.mode'];
      const verifyToken = request.query['hub.verify_token'];
      const challenge = request.query['hub.challenge'];

      // TODO: Validate verify_token against stored webhook secret
      if (mode === 'subscribe' && verifyToken) {
        return reply.status(200).send(challenge);
      }

      return reply.status(403).send({ message: 'Verification failed' });
    },
  });

  // POST /v1/webhooks/telegram — Telegram webhook
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/webhooks/telegram',
    schema: {
      tags: ['Messaging - Webhooks'],
      summary: 'Telegram webhook',
      body: z.unknown(),
      response: {
        200: z.object({ status: z.string() }),
        400: z.object({ message: z.string() }),
      },
    },
    handler: async (request, reply) => {
      const secretToken =
        (request.headers['x-telegram-bot-api-secret-token'] as string) ?? '';
      const accountId = (request.headers['x-account-id'] as string) ?? '';

      if (!accountId) {
        return reply
          .status(400)
          .send({ message: 'Missing x-account-id header' });
      }

      try {
        const useCase = makeReceiveWebhookUseCase('TELEGRAM');
        await useCase.execute({
          channel: 'TELEGRAM',
          accountId,
          rawPayload: request.body,
          signature: secretToken,
        });

        return reply.status(200).send({ status: 'ok' });
      } catch (error) {
        if (error instanceof BadRequestError) {
          return reply.status(400).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
