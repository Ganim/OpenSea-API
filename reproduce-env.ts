import { execSync } from 'child_process';
import pg from 'pg';

const { Pool } = pg;
const baseUrl = process.env.DATABASE_URL!;
const testSchema = 'test_manual_environment';

const pool = new Pool({ connectionString: baseUrl });

async function reproduceEnvironment() {
  try {
    // Criar schema
    await pool.query(`DROP SCHEMA IF EXISTS "${testSchema}" CASCADE`);
    await pool.query(`CREATE SCHEMA "${testSchema}"`);
    console.log(`✅ Schema ${testSchema} criado`);

    // Gerar URL com o schema
    const url = new URL(baseUrl);
    url.searchParams.set('schema', testSchema);
    const databaseUrl = url.toString();

    console.log('\n🔧 Executando prisma db push como no environment...');
    console.log('DATABASE_URL:', databaseUrl);

    execSync('npx prisma db push --force-reset', {
      env: {
        ...process.env,
        DATABASE_URL: databaseUrl,
      },
      stdio: 'inherit',
    });

    // Verificar colunas criadas
    const result = await pool.query(`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns
      WHERE table_schema = '${testSchema}' 
        AND table_name = 'users'
      ORDER BY ordinal_position
    `);

    console.log('\n📋 Colunas criadas:');
    console.table(
      result.rows.map((r) => ({
        column: r.column_name,
        type: r.data_type,
        default: r.column_default,
      })),
    );

    // Testar query
    console.log('\n🧪 Testando query...');
    const { PrismaPg } = await import('@prisma/adapter-pg');
    const { PrismaClient } = await import(
      './prisma/generated/prisma/client.js'
    );

    const adapter = new PrismaPg({ connectionString: databaseUrl });
    const prisma = new PrismaClient({ adapter });

    try {
      await prisma.user.findFirst({
        where: { email: 'test@test.com' },
        include: { profile: true },
      });
      console.log('✅ Query funcionou!');
    } catch (error: unknown) {
      const err = error as Error & { meta?: unknown };
      console.error('❌ Query falhou:', err.message);
      if (err.meta) {
        console.error('Meta:', JSON.stringify(err.meta, null, 2));
      }
    } finally {
      await prisma.$disconnect();
    }
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await pool.query(`DROP SCHEMA IF EXISTS "${testSchema}" CASCADE`);
    console.log(`\n🧹 Schema removido`);
    await pool.end();
  }
}

reproduceEnvironment();
