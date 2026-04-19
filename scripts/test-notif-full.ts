import { prisma } from '../src/lib/prisma';
import { bootstrapNotificationsModule } from '../src/modules/notifications/bootstrap';
import {
  notificationClient,
  NotificationType,
  NotificationPriority,
  NotificationChannel,
} from '../src/modules/notifications/public';
import {
  buildUnsubscribeToken,
  verifyUnsubscribeToken,
} from '../src/modules/notifications/application/unsubscribe-token';

async function main() {
  // Bootstrap without socket (so emitToUser is no-op instead of throwing)
  await bootstrapNotificationsModule({ useSocket: false });

  const tenant = await prisma.tenant.findFirst({
    where: { slug: 'empresa-demo' },
  });
  if (!tenant) throw new Error('Seed needed');
  const tu = await prisma.tenantUser.findFirst({
    where: { tenantId: tenant.id, deletedAt: null },
    include: { user: true },
  });
  if (!tu) throw new Error('No tenant user');

  console.log(`[env] tenant=${tenant.slug} user=${tu.user.email}`);

  // -- unsubscribe token roundtrip --
  const category = await prisma.notificationCategory.findFirst({
    where: { code: 'hr.kudos_received' },
  });
  if (!category) throw new Error('category hr.kudos_received missing');

  const token = buildUnsubscribeToken(tu.userId, category.id);
  const parsed = verifyUnsubscribeToken(token);
  console.log('[unsubscribe] token roundtrip =', parsed ? 'OK' : 'FAIL');

  // -- dispatch with IN_APP only (skip email/push since dev env may not have SMTP) --
  const r = await notificationClient.dispatch({
    type: NotificationType.INFORMATIONAL,
    category: 'core.system_announcement',
    tenantId: tenant.id,
    recipients: { userIds: [tu.userId] },
    title: '[full-test] OpenSea v2',
    body: 'Testa o fluxo completo com adapters registrados.',
    priority: NotificationPriority.NORMAL,
    channels: [NotificationChannel.IN_APP],
    idempotencyKey: `full-test-${Date.now()}`,
  });
  console.log('[dispatch] result =', r);

  // Wait a beat so the fan-out write finishes
  await new Promise((res) => setTimeout(res, 500));

  // -- verify delivery attempt was recorded --
  if (r.notificationIds.length > 0) {
    const attempts = await prisma.notificationDeliveryAttempt.findMany({
      where: { notificationId: r.notificationIds[0] },
    });
    console.log('[delivery] attempts recorded =', attempts.length);
    attempts.forEach((a) =>
      console.log(
        `   channel=${a.channel} status=${a.status} provider=${a.providerName}`,
      ),
    );
  }

  // -- modules manifest endpoint data (simulated) --
  const modules = await prisma.notificationModuleRegistry.findMany({
    where: { isActive: true },
    orderBy: { order: 'asc' },
  });
  const cats = await prisma.notificationCategory.count({
    where: { isActive: true },
  });
  console.log(`[manifest] ${modules.length} modules, ${cats} categories`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
