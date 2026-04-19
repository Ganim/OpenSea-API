import { prisma } from '../src/lib/prisma';
import { bootstrapNotificationsModule } from '../src/modules/notifications/bootstrap';
import {
  notificationClient,
  NotificationType,
  NotificationPriority,
} from '../src/modules/notifications/public';

async function main() {
  await bootstrapNotificationsModule();

  // Grab any admin user and tenant for the test
  const tenant = await prisma.tenant.findFirst({
    where: { slug: 'empresa-demo' },
  });
  if (!tenant)
    throw new Error('Tenant empresa-demo not found (run prisma seed)');

  const tenantUser = await prisma.tenantUser.findFirst({
    where: { tenantId: tenant.id, deletedAt: null },
    include: { user: true },
  });
  if (!tenantUser) throw new Error('No tenant users found');

  console.log(`Using tenant=${tenant.slug} user=${tenantUser.user.email}`);

  // --- Test 1: INFORMATIONAL ---
  console.log('\n[1] Dispatching INFORMATIONAL notification...');
  const r1 = await notificationClient.dispatch({
    type: NotificationType.INFORMATIONAL,
    category: 'core.system_announcement',
    tenantId: tenant.id,
    recipients: { userIds: [tenantUser.userId] },
    title: 'Teste de notificação informativa',
    body: 'Este é um teste do sistema de notificações v2.',
    priority: NotificationPriority.NORMAL,
    idempotencyKey: `test-info-${Date.now()}`,
  });
  console.log('  → result:', r1);

  // --- Test 2: APPROVAL ---
  console.log('\n[2] Dispatching APPROVAL notification...');
  const approvalKey = `test-approval-${Date.now()}`;
  const r2 = await notificationClient.dispatch({
    type: NotificationType.APPROVAL,
    category: 'hr.vacation_request',
    tenantId: tenant.id,
    recipients: { userIds: [tenantUser.userId] },
    title: 'Solicitação de férias pendente',
    body: 'João Silva solicitou 10 dias de férias começando em 2026-06-01.',
    priority: NotificationPriority.HIGH,
    idempotencyKey: approvalKey,
    callbackUrl: '/v1/hr/vacations/callback',
    entity: { type: 'vacation_request', id: 'fake-vacation-id' },
    requireReasonOnReject: true,
  });
  console.log('  → result:', r2);

  // --- Test 3: Dedup ---
  console.log('\n[3] Dispatching same key again (should dedupe)...');
  const r3 = await notificationClient.dispatch({
    type: NotificationType.APPROVAL,
    category: 'hr.vacation_request',
    tenantId: tenant.id,
    recipients: { userIds: [tenantUser.userId] },
    title: 'Solicitação de férias pendente (duplicate)',
    body: 'Mensagem diferente — deve ser ignorada.',
    idempotencyKey: approvalKey,
    callbackUrl: '/v1/hr/vacations/callback',
  });
  console.log('  → result:', r3, '(deduplicated =', r3.deduplicated, ')');

  // --- Test 4: Resolve ---
  if (r2.notificationIds.length > 0) {
    console.log('\n[4] Resolving approval with actionKey=approve...');
    const resolved = await notificationClient.resolve({
      notificationId: r2.notificationIds[0],
      userId: tenantUser.userId,
      actionKey: 'approve',
      payload: { comment: 'OK, férias aprovadas' },
    });
    console.log('  → result:', resolved);
  }

  // --- Test 5: Check persisted state ---
  console.log('\n[5] Fetching notifications from DB...');
  const notifications = await prisma.notification.findMany({
    where: {
      tenantId: tenant.id,
      userId: tenantUser.userId,
      idempotencyKey: { startsWith: 'test-' },
    },
    orderBy: { createdAt: 'desc' },
    take: 5,
    select: {
      id: true,
      title: true,
      kind: true,
      state: true,
      resolvedAction: true,
      isRead: true,
    },
  });
  console.log('  Notifications:');
  notifications.forEach((n) =>
    console.log(
      `   - [${n.kind}] ${n.title} → state=${n.state} resolved=${n.resolvedAction} read=${n.isRead}`,
    ),
  );

  // --- Cleanup (leave them so user can inspect) ---
  console.log('\nDone. Test notifications remain in DB for inspection.');
}

main()
  .catch((err) => {
    console.error('FAILED:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
