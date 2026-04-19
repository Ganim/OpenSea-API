import { prisma } from '../src/lib/prisma';

async function main() {
  const tables: Array<{ table_name: string }> = await prisma.$queryRaw`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public'
      AND (table_name LIKE 'notification%'
        OR table_name LIKE 'user_notification%'
        OR table_name LIKE 'push_%')
    ORDER BY table_name
  `;
  console.log('Notification-related tables:');
  tables.forEach((t) => console.log(' -', t.table_name));

  const enums: Array<{ typname: string }> = await prisma.$queryRaw`
    SELECT t.typname
    FROM pg_type t
    WHERE t.typtype = 'e'
      AND t.typname LIKE 'Notification%'
    ORDER BY t.typname
  `;
  console.log('\nNotification enums:');
  enums.forEach((e) => console.log(' -', e.typname));

  const notifCols: Array<{ column_name: string }> = await prisma.$queryRaw`
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'notifications'
    ORDER BY ordinal_position
  `;
  console.log('\nnotifications table columns:');
  notifCols.forEach((c) => console.log(' -', c.column_name));
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
