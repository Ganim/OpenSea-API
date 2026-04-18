/**
 * HTTP routes for the v2 notifications system.
 *
 * Mounted under `/v1/notifications/*` alongside the legacy controllers.
 * Every route requires a valid JWT + tenant scope. Tenant is read from
 * the JWT claim.
 */

import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';

import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { prisma } from '@/lib/prisma';

import { notificationClient } from '../public/index.js';
import {
  NotificationType,
  NotificationPriority,
  type NotificationChannel,
} from '../public/types.js';

interface JwtClaims {
  sub: string;
  tenantId?: string;
}

function getTenant(request: FastifyRequest): {
  tenantId: string;
  userId: string;
} {
  const user = request.user as JwtClaims;
  if (!user?.tenantId) {
    throw new Error('Tenant not selected');
  }
  return { tenantId: user.tenantId, userId: user.sub };
}

export async function notificationsV2Routes(
  app: FastifyInstance,
): Promise<void> {
  const api = app.withTypeProvider<ZodTypeProvider>();

  // ============================================================
  // GET /v1/notifications/me — v2 list endpoint returning the full
  // notification record (kind, state, actions, ...) so the frontend can
  // render APPROVAL/FORM/ACTIONABLE properly.
  // ============================================================
  api.route({
    method: 'GET',
    url: '/v1/notifications/me',
    preHandler: [verifyJwt],
    schema: {
      tags: ['Notifications v2'],
      querystring: z.object({
        isRead: z.coerce.boolean().optional(),
        kind: z
          .enum([
            'INFORMATIONAL',
            'LINK',
            'ACTIONABLE',
            'APPROVAL',
            'FORM',
            'PROGRESS',
            'SYSTEM_BANNER',
          ])
          .optional(),
        state: z
          .enum(['PENDING', 'RESOLVED', 'EXPIRED', 'DECLINED', 'CANCELLED'])
          .optional(),
        limit: z.coerce.number().int().min(1).max(100).default(50),
        cursor: z.string().uuid().optional(),
      }),
    },
    handler: async (request, reply) => {
      const { tenantId, userId } = getTenant(request);
      const q = request.query as {
        isRead?: boolean;
        kind?: string;
        state?: string;
        limit: number;
        cursor?: string;
      };

      const where: Record<string, unknown> = {
        userId,
        tenantId,
        deletedAt: null,
      };
      if (typeof q.isRead === 'boolean') where.isRead = q.isRead;
      if (q.kind) where.kind = q.kind;
      if (q.state) where.state = q.state;

      const rows = await prisma.notification.findMany({
        where: where as never,
        orderBy: { createdAt: 'desc' },
        take: q.limit + 1,
        ...(q.cursor ? { cursor: { id: q.cursor }, skip: 1 } : {}),
      });

      const hasNext = rows.length > q.limit;
      const items = hasNext ? rows.slice(0, q.limit) : rows;

      const [totalUnread, total] = await Promise.all([
        prisma.notification.count({
          where: { userId, tenantId, deletedAt: null, isRead: false },
        }),
        prisma.notification.count({
          where: { userId, tenantId, deletedAt: null },
        }),
      ]);

      return reply.send({
        notifications: items.map((n) => ({
          id: n.id,
          title: n.title,
          message: n.message,
          kind: n.kind,
          priority: n.priority,
          channel: n.channel,
          channels: n.channels,
          state: n.state,
          actions: n.actions,
          actionUrl: n.actionUrl,
          fallbackUrl: n.fallbackUrl,
          actionText: n.actionText,
          resolvedAction: n.resolvedAction,
          resolvedAt: n.resolvedAt?.toISOString() ?? null,
          entityType: n.entityType,
          entityId: n.entityId,
          metadata: n.metadata,
          isRead: n.isRead,
          readAt: n.readAt?.toISOString() ?? null,
          progress: n.progress,
          progressTotal: n.progressTotal,
          expiresAt: n.expiresAt?.toISOString() ?? null,
          createdAt: n.createdAt.toISOString(),
        })),
        nextCursor: hasNext ? items[items.length - 1].id : null,
        total,
        totalUnread,
      });
    },
  });

  // ============================================================
  // POST /v1/notifications/:id/resolve — resolve actionable/approval/form
  // ============================================================
  api.route({
    method: 'POST',
    url: '/v1/notifications/:id/resolve',
    preHandler: [verifyJwt],
    schema: {
      tags: ['Notifications v2'],
      params: z.object({ id: z.string().uuid() }),
      body: z.object({
        actionKey: z.string().min(1),
        payload: z.record(z.string(), z.unknown()).optional(),
        reason: z.string().optional(),
      }),
      response: {
        200: z.object({
          notificationId: z.string(),
          state: z.enum(['RESOLVED', 'DECLINED']),
          callbackQueued: z.boolean(),
        }),
      },
    },
    handler: async (request, reply) => {
      const { userId } = getTenant(request);
      const { id } = request.params as { id: string };
      const body = request.body as {
        actionKey: string;
        payload?: Record<string, unknown>;
        reason?: string;
      };
      const result = await notificationClient.resolve({
        notificationId: id,
        userId,
        actionKey: body.actionKey,
        payload: body.payload,
        reason: body.reason,
      });
      return reply.send(result);
    },
  });

  // ============================================================
  // POST /v1/notifications/:id/progress — producer updates progress
  // ============================================================
  api.route({
    method: 'POST',
    url: '/v1/notifications/:id/progress',
    preHandler: [verifyJwt],
    schema: {
      tags: ['Notifications v2'],
      params: z.object({ id: z.string().uuid() }),
      body: z.object({
        progress: z.number().int().min(0),
        message: z.string().optional(),
        completed: z.boolean().optional(),
      }),
      response: { 204: z.null() },
    },
    handler: async (request, reply) => {
      const { id } = request.params as { id: string };
      const body = request.body as {
        progress: number;
        message?: string;
        completed?: boolean;
      };
      await notificationClient.updateProgress({
        notificationId: id,
        progress: body.progress,
        message: body.message,
        completed: body.completed,
      });
      return reply.code(204).send(null);
    },
  });

  // ============================================================
  // GET /v1/notifications/modules-manifest — category tree for the UI
  // ============================================================
  api.route({
    method: 'GET',
    url: '/v1/notifications/modules-manifest',
    preHandler: [verifyJwt],
    schema: {
      tags: ['Notifications v2'],
      response: {
        200: z.object({
          modules: z.array(
            z.object({
              code: z.string(),
              displayName: z.string(),
              icon: z.string().nullable(),
              order: z.number(),
              categories: z.array(
                z.object({
                  id: z.string(),
                  code: z.string(),
                  name: z.string(),
                  description: z.string().nullable(),
                  defaultKind: z.string(),
                  defaultPriority: z.string(),
                  defaultChannels: z.array(z.string()),
                  digestSupported: z.boolean(),
                  mandatory: z.boolean(),
                  order: z.number(),
                }),
              ),
            }),
          ),
        }),
      },
    },
    handler: async (_request, reply) => {
      const modules = await prisma.notificationModuleRegistry.findMany({
        where: { isActive: true },
        orderBy: { order: 'asc' },
      });
      const categories = await prisma.notificationCategory.findMany({
        where: { isActive: true },
        orderBy: [{ module: 'asc' }, { order: 'asc' }],
      });
      const byModule = new Map<string, typeof categories>();
      for (const cat of categories) {
        if (!byModule.has(cat.module)) byModule.set(cat.module, []);
        byModule.get(cat.module)!.push(cat);
      }
      return reply.send({
        modules: modules.map((m) => ({
          code: m.code,
          displayName: m.displayName,
          icon: m.icon,
          order: m.order,
          categories: (byModule.get(m.code) ?? []).map((c) => ({
            id: c.id,
            code: c.code,
            name: c.name,
            description: c.description,
            defaultKind: c.defaultKind,
            defaultPriority: c.defaultPriority,
            defaultChannels: c.defaultChannels,
            digestSupported: c.digestSupported,
            mandatory: c.mandatory,
            order: c.order,
          })),
        })),
      });
    },
  });

  // ============================================================
  // GET /v1/notifications/settings — user's global settings
  // ============================================================
  api.route({
    method: 'GET',
    url: '/v1/notifications/settings',
    preHandler: [verifyJwt],
    schema: {
      tags: ['Notifications v2'],
      response: {
        200: z.object({
          doNotDisturb: z.boolean(),
          dndStart: z.string().nullable(),
          dndEnd: z.string().nullable(),
          timezone: z.string(),
          digestSchedule: z.string().nullable(),
          soundEnabled: z.boolean(),
          masterInApp: z.boolean(),
          masterEmail: z.boolean(),
          masterPush: z.boolean(),
          masterSms: z.boolean(),
          masterWhatsapp: z.boolean(),
        }),
      },
    },
    handler: async (request, reply) => {
      const { tenantId, userId } = getTenant(request);
      const settings = await prisma.userNotificationSettings.upsert({
        where: { userId_tenantId: { userId, tenantId } },
        update: {},
        create: { userId, tenantId },
      });
      return reply.send({
        doNotDisturb: settings.doNotDisturb,
        dndStart: settings.dndStart,
        dndEnd: settings.dndEnd,
        timezone: settings.timezone,
        digestSchedule: settings.digestSchedule,
        soundEnabled: settings.soundEnabled,
        masterInApp: settings.masterInApp,
        masterEmail: settings.masterEmail,
        masterPush: settings.masterPush,
        masterSms: settings.masterSms,
        masterWhatsapp: settings.masterWhatsapp,
      });
    },
  });

  // ============================================================
  // PUT /v1/notifications/settings — update global settings
  // ============================================================
  api.route({
    method: 'PUT',
    url: '/v1/notifications/settings',
    preHandler: [verifyJwt],
    schema: {
      tags: ['Notifications v2'],
      body: z.object({
        doNotDisturb: z.boolean().optional(),
        dndStart: z
          .string()
          .regex(/^\d{2}:\d{2}$/)
          .nullable()
          .optional(),
        dndEnd: z
          .string()
          .regex(/^\d{2}:\d{2}$/)
          .nullable()
          .optional(),
        timezone: z.string().optional(),
        digestSchedule: z.string().nullable().optional(),
        soundEnabled: z.boolean().optional(),
        masterInApp: z.boolean().optional(),
        masterEmail: z.boolean().optional(),
        masterPush: z.boolean().optional(),
        masterSms: z.boolean().optional(),
        masterWhatsapp: z.boolean().optional(),
      }),
      response: { 204: z.null() },
    },
    handler: async (request, reply) => {
      const { tenantId, userId } = getTenant(request);
      const body = request.body as Record<string, unknown>;
      await prisma.userNotificationSettings.upsert({
        where: { userId_tenantId: { userId, tenantId } },
        update: body,
        create: { userId, tenantId, ...body },
      });
      return reply.code(204).send(null);
    },
  });

  // ============================================================
  // GET /v1/notifications/preferences — per-category preferences
  // ============================================================
  api.route({
    method: 'GET',
    url: '/v1/notifications/preferences',
    preHandler: [verifyJwt],
    schema: {
      tags: ['Notifications v2'],
      response: {
        200: z.object({
          modules: z.array(
            z.object({
              code: z.string(),
              isEnabled: z.boolean(),
            }),
          ),
          preferences: z.array(
            z.object({
              categoryCode: z.string(),
              channel: z.string(),
              isEnabled: z.boolean(),
              frequency: z.string(),
            }),
          ),
        }),
      },
    },
    handler: async (request, reply) => {
      const { tenantId, userId } = getTenant(request);
      const [modules, prefs] = await Promise.all([
        prisma.notificationModuleSetting.findMany({
          where: { userId, tenantId },
        }),
        prisma.notificationPreferenceV2.findMany({
          where: { userId, tenantId },
          include: { category: { select: { code: true } } },
        }),
      ]);
      return reply.send({
        modules: modules.map((m) => ({
          code: m.module,
          isEnabled: m.isEnabled,
        })),
        preferences: prefs.map((p) => ({
          categoryCode: p.category.code,
          channel: p.channel,
          isEnabled: p.isEnabled,
          frequency: p.frequency,
        })),
      });
    },
  });

  // ============================================================
  // PUT /v1/notifications/preferences — bulk upsert preferences
  // ============================================================
  api.route({
    method: 'PUT',
    url: '/v1/notifications/preferences',
    preHandler: [verifyJwt],
    schema: {
      tags: ['Notifications v2'],
      body: z.object({
        modules: z
          .array(z.object({ code: z.string(), isEnabled: z.boolean() }))
          .optional(),
        preferences: z
          .array(
            z.object({
              categoryCode: z.string(),
              channel: z.enum(['IN_APP', 'EMAIL', 'PUSH', 'SMS', 'WHATSAPP']),
              isEnabled: z.boolean(),
              frequency: z
                .enum([
                  'INSTANT',
                  'HOURLY_DIGEST',
                  'DAILY_DIGEST',
                  'WEEKLY_DIGEST',
                  'DISABLED',
                ])
                .default('INSTANT'),
            }),
          )
          .optional(),
      }),
      response: { 204: z.null() },
    },
    handler: async (request, reply) => {
      const { tenantId, userId } = getTenant(request);
      const body = request.body as {
        modules?: Array<{ code: string; isEnabled: boolean }>;
        preferences?: Array<{
          categoryCode: string;
          channel: string;
          isEnabled: boolean;
          frequency: string;
        }>;
      };

      if (body.modules) {
        for (const m of body.modules) {
          await prisma.notificationModuleSetting.upsert({
            where: {
              userId_tenantId_module: {
                userId,
                tenantId,
                module: m.code,
              },
            },
            update: { isEnabled: m.isEnabled },
            create: {
              userId,
              tenantId,
              module: m.code,
              isEnabled: m.isEnabled,
            },
          });
        }
      }

      if (body.preferences) {
        const categories = await prisma.notificationCategory.findMany({
          where: {
            code: {
              in: body.preferences.map((p) => p.categoryCode),
            },
          },
          select: { id: true, code: true },
        });
        const byCode = new Map(categories.map((c) => [c.code, c.id]));

        for (const p of body.preferences) {
          const categoryId = byCode.get(p.categoryCode);
          if (!categoryId) continue;
          await prisma.notificationPreferenceV2.upsert({
            where: {
              userId_tenantId_categoryId_channel: {
                userId,
                tenantId,
                categoryId,
                channel: p.channel as
                  | 'IN_APP'
                  | 'EMAIL'
                  | 'PUSH'
                  | 'SMS'
                  | 'WHATSAPP',
              },
            },
            update: {
              isEnabled: p.isEnabled,
              frequency: p.frequency as
                | 'INSTANT'
                | 'HOURLY_DIGEST'
                | 'DAILY_DIGEST'
                | 'WEEKLY_DIGEST'
                | 'DISABLED',
            },
            create: {
              userId,
              tenantId,
              categoryId,
              channel: p.channel as
                | 'IN_APP'
                | 'EMAIL'
                | 'PUSH'
                | 'SMS'
                | 'WHATSAPP',
              isEnabled: p.isEnabled,
              frequency: p.frequency as
                | 'INSTANT'
                | 'HOURLY_DIGEST'
                | 'DAILY_DIGEST'
                | 'WEEKLY_DIGEST'
                | 'DISABLED',
            },
          });
        }
      }

      return reply.code(204).send(null);
    },
  });

  // ============================================================
  // POST /v1/notifications/push-subscriptions — register web push
  // ============================================================
  api.route({
    method: 'POST',
    url: '/v1/notifications/push-subscriptions',
    preHandler: [verifyJwt],
    schema: {
      tags: ['Notifications v2'],
      body: z.object({
        endpoint: z.string().url(),
        keys: z.object({
          p256dh: z.string().min(1),
          auth: z.string().min(1),
        }),
        deviceName: z.string().optional(),
        userAgent: z.string().optional(),
      }),
      response: {
        201: z.object({ id: z.string() }),
      },
    },
    handler: async (request, reply) => {
      const { tenantId, userId } = getTenant(request);
      const body = request.body as {
        endpoint: string;
        keys: { p256dh: string; auth: string };
        deviceName?: string;
        userAgent?: string;
      };
      const sub = await prisma.pushSubscription.upsert({
        where: { endpoint: body.endpoint },
        update: {
          userId,
          tenantId,
          p256dhKey: body.keys.p256dh,
          authKey: body.keys.auth,
          deviceName: body.deviceName,
          userAgent: body.userAgent,
          revokedAt: null,
          lastSeenAt: new Date(),
        },
        create: {
          userId,
          tenantId,
          endpoint: body.endpoint,
          p256dhKey: body.keys.p256dh,
          authKey: body.keys.auth,
          deviceName: body.deviceName,
          userAgent: body.userAgent,
          lastSeenAt: new Date(),
        },
      });
      return reply.code(201).send({ id: sub.id });
    },
  });

  // ============================================================
  // DELETE /v1/notifications/push-subscriptions/:id
  // ============================================================
  api.route({
    method: 'DELETE',
    url: '/v1/notifications/push-subscriptions/:id',
    preHandler: [verifyJwt],
    schema: {
      tags: ['Notifications v2'],
      params: z.object({ id: z.string().uuid() }),
      response: { 204: z.null() },
    },
    handler: async (request, reply) => {
      const { userId } = getTenant(request);
      const { id } = request.params as { id: string };
      await prisma.pushSubscription.updateMany({
        where: { id, userId },
        data: { revokedAt: new Date() },
      });
      return reply.code(204).send(null);
    },
  });

  // ============================================================
  // GET /v1/notifications/push-subscriptions — list devices
  // ============================================================
  api.route({
    method: 'GET',
    url: '/v1/notifications/push-subscriptions',
    preHandler: [verifyJwt],
    schema: {
      tags: ['Notifications v2'],
      response: {
        200: z.object({
          devices: z.array(
            z.object({
              id: z.string(),
              deviceName: z.string().nullable(),
              userAgent: z.string().nullable(),
              lastSeenAt: z.string().nullable(),
              createdAt: z.string(),
            }),
          ),
        }),
      },
    },
    handler: async (request, reply) => {
      const { userId } = getTenant(request);
      const devices = await prisma.pushSubscription.findMany({
        where: { userId, revokedAt: null },
        orderBy: { lastSeenAt: 'desc' },
      });
      return reply.send({
        devices: devices.map((d) => ({
          id: d.id,
          deviceName: d.deviceName,
          userAgent: d.userAgent,
          lastSeenAt: d.lastSeenAt?.toISOString() ?? null,
          createdAt: d.createdAt.toISOString(),
        })),
      });
    },
  });

  // ============================================================
  // POST /v1/notifications/test-send — send a sample of each type
  // ============================================================
  api.route({
    method: 'POST',
    url: '/v1/notifications/test-send',
    preHandler: [verifyJwt],
    schema: {
      tags: ['Notifications v2'],
      body: z
        .object({
          type: z
            .enum([
              'INFORMATIONAL',
              'LINK',
              'ACTIONABLE',
              'APPROVAL',
              'FORM',
              'PROGRESS',
              'SYSTEM_BANNER',
            ])
            .optional(),
        })
        .optional(),
      response: {
        200: z.object({
          dispatched: z.array(z.string()),
        }),
      },
    },
    handler: async (request, reply) => {
      const { tenantId, userId } = getTenant(request);
      const body =
        (request.body as { type?: NotificationType } | undefined) ?? {};
      const types: NotificationType[] = body.type
        ? [body.type]
        : [
            NotificationType.INFORMATIONAL,
            NotificationType.LINK,
            NotificationType.ACTIONABLE,
            NotificationType.APPROVAL,
            NotificationType.FORM,
            NotificationType.PROGRESS,
          ];

      const dispatched: string[] = [];

      for (const type of types) {
        const key = `test-${type}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        const base = {
          tenantId,
          recipients: { userIds: [userId] },
          priority: NotificationPriority.NORMAL,
          category: 'core.system_announcement',
          idempotencyKey: key,
          title: `Teste ${type}`,
          body: `Exemplo de notificação do tipo ${type}.`,
          channels: ['IN_APP'] as NotificationChannel[],
        };

        switch (type) {
          case NotificationType.INFORMATIONAL:
            await notificationClient.dispatch({
              type: NotificationType.INFORMATIONAL,
              ...base,
            });
            break;
          case NotificationType.LINK:
            await notificationClient.dispatch({
              type: NotificationType.LINK,
              ...base,
              actionUrl: '/notifications',
              actionText: 'Abrir',
            });
            break;
          case NotificationType.ACTIONABLE:
            await notificationClient.dispatch({
              type: NotificationType.ACTIONABLE,
              ...base,
              callbackUrl: '/v1/notifications/test-callback',
              actions: [
                { key: 'yes', label: 'Sim', style: 'primary' },
                { key: 'no', label: 'Não', style: 'ghost' },
              ],
            });
            break;
          case NotificationType.APPROVAL:
            await notificationClient.dispatch({
              type: NotificationType.APPROVAL,
              ...base,
              callbackUrl: '/v1/notifications/test-callback',
              requireReasonOnReject: true,
            });
            break;
          case NotificationType.FORM:
            await notificationClient.dispatch({
              type: NotificationType.FORM,
              ...base,
              callbackUrl: '/v1/notifications/test-callback',
              fields: [
                {
                  key: 'quantity',
                  label: 'Quantidade',
                  type: 'number',
                  required: true,
                },
                {
                  key: 'note',
                  label: 'Observação',
                  type: 'textarea',
                },
              ],
            });
            break;
          case NotificationType.PROGRESS:
            await notificationClient.dispatch({
              type: NotificationType.PROGRESS,
              ...base,
              initialProgress: 0,
              totalSteps: 100,
            });
            break;
        }
        dispatched.push(type);
      }

      return reply.send({ dispatched });
    },
  });
}
