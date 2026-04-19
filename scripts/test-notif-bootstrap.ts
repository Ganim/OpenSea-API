import { prisma } from '../src/lib/prisma';
import { bootstrapNotificationsModule } from '../src/modules/notifications/bootstrap';
import {
  listRegisteredManifests,
  notificationClient,
} from '../src/modules/notifications/public';

async function main() {
  console.log('Bootstrapping notifications module...');
  await bootstrapNotificationsModule();

  console.log('\nIn-memory manifests registered:');
  const manifests = listRegisteredManifests();
  manifests.forEach((m) => {
    console.log(
      ` - ${m.module} (${m.displayName}) — ${m.categories.length} categorias`,
    );
  });

  console.log('\nDB state:');
  const moduleCount = await prisma.notificationModuleRegistry.count();
  const categoryCount = await prisma.notificationCategory.count();
  console.log(` - notification_module_registry: ${moduleCount} modules`);
  console.log(` - notification_categories: ${categoryCount} categories`);

  const samples = await prisma.notificationCategory.findMany({
    take: 5,
    orderBy: { code: 'asc' },
    select: {
      code: true,
      module: true,
      defaultKind: true,
      defaultPriority: true,
    },
  });
  console.log('\nSample categories:');
  samples.forEach((s) =>
    console.log(
      `  - ${s.code} (${s.module}) kind=${s.defaultKind} prio=${s.defaultPriority}`,
    ),
  );

  // Sanity check: client is available
  console.log(
    '\nNotificationClient is available:',
    typeof notificationClient.dispatch === 'function',
  );
}

main()
  .catch((err) => {
    console.error('FAILED:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
