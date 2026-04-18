/**
 * Admin health endpoint for notifications — super-admin only.
 * Returns queue depth, last 24h delivery rates per channel, top failing
 * categories, and outstanding DLQ callback jobs.
 */

import type { FastifyInstance } from 'fastify';

import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifySuperAdmin } from '@/http/middlewares/rbac/verify-super-admin';
import { prisma } from '@/lib/prisma';

export async function notificationsAdminHealthRoutes(
  app: FastifyInstance,
): Promise<void> {
  app.route({
    method: 'GET',
    url: '/v1/admin/notifications/health',
    preHandler: [verifyJwt, verifySuperAdmin],
    handler: async (_request, reply) => {
      const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      const [
        totals24h,
        attemptByStatus,
        topFailed,
        pendingCallbacks,
        subsCount,
      ] = await Promise.all([
        prisma.notification.count({ where: { createdAt: { gte: since24h } } }),
        prisma.notificationDeliveryAttempt.groupBy({
          by: ['channel', 'status'],
          where: { createdAt: { gte: since24h } },
          _count: { _all: true },
        }),
        prisma.notificationDeliveryAttempt.groupBy({
          by: ['channel'],
          where: { status: 'FAILED', createdAt: { gte: since7d } },
          _count: { _all: true },
          orderBy: { _count: { channel: 'desc' } },
          take: 5,
        }),
        prisma.notificationCallbackJob.count({
          where: { status: 'PENDING' },
        }),
        prisma.pushSubscription.count({ where: { revokedAt: null } }),
      ]);

      return reply.send({
        window: '24h',
        totals: {
          notificationsCreated24h: totals24h,
          callbacksPending: pendingCallbacks,
          pushSubscriptionsActive: subsCount,
        },
        byChannel: attemptByStatus.reduce(
          (acc, row) => {
            const key = row.channel;
            if (!acc[key]) acc[key] = {};
            acc[key][row.status] = row._count._all;
            return acc;
          },
          {} as Record<string, Record<string, number>>,
        ),
        topFailedChannels7d: topFailed.map((r) => ({
          channel: r.channel,
          failures: r._count._all,
        })),
      });
    },
  });
}
