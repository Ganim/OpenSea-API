/**
 * Script para limpar o banco de dados
 * - Remove todos os schemas de teste órfãos
 * - Limpa todos os dados do schema public
 *
 * Uso: npx tsx prisma/clean-database.ts
 */

import { PrismaClient } from './generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function cleanTestSchemas() {
  console.log('🧹 Removendo schemas de teste órfãos...');

  // Lista todos os schemas que começam com 'test_'
  const schemas = await prisma.$queryRaw<{ schema_name: string }[]>`
    SELECT schema_name 
    FROM information_schema.schemata 
    WHERE schema_name LIKE 'test_%'
  `;

  if (schemas.length === 0) {
    console.log('   Nenhum schema de teste encontrado');
    return;
  }

  for (const schema of schemas) {
    try {
      await prisma.$executeRawUnsafe(
        `DROP SCHEMA IF EXISTS "${schema.schema_name}" CASCADE`,
      );
      console.log(`   ✅ Schema ${schema.schema_name} removido`);
    } catch (error) {
      console.error(`   ❌ Erro ao remover ${schema.schema_name}:`, error);
    }
  }

  console.log(`   Total: ${schemas.length} schemas de teste removidos`);
}

async function cleanPublicSchema() {
  console.log('\n🗑️  Limpando dados do schema public...');

  // Ordem de deleção respeitando foreign keys
  const tables = [
    // RBAC
    'user_permission_groups',
    'permission_group_permissions',
    'permission_groups',
    'permissions',

    // Sales
    'comments',
    'item_reservations',
    'sales_order_items',
    'sales_orders',
    'variant_promotions',
    'notification_preferences',
    'customers',

    // Stock
    'item_movements',
    'items',
    'variants',
    'products',
    'categories',
    'tags',
    'templates',
    'locations',
    'manufacturers',
    'suppliers',
    'purchase_orders',

    // Core
    'refresh_tokens',
    'sessions',
    'user_profiles',
    'users',

    //Others
    'work_schedules',
  ];

  for (const table of tables) {
    try {
      const result = await prisma.$executeRawUnsafe(
        `TRUNCATE TABLE "${table}" CASCADE`,
      );
      console.log(`   ✅ Tabela ${table} limpa`);
    } catch (error: unknown) {
      // Ignora se a tabela não existe
      const errorMessage = error instanceof Error ? error.message : 'erro desconhecido';
      if (!errorMessage.includes('does not exist')) {
        console.log(`   ⚠️  Tabela ${table}: ${errorMessage}`);
      }
    }
  }

  console.log('\n✅ Banco de dados limpo com sucesso!');
}

async function main() {
  console.log('🚀 Iniciando limpeza do banco de dados...\n');

  try {
    await cleanTestSchemas();
    await cleanPublicSchema();
  } catch (error) {
    console.error('❌ Erro durante a limpeza:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
