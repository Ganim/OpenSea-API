import { prisma } from '@/lib/prisma';
import { randomUUID } from 'node:crypto';

interface CreateAndSetupTenantOptions {
  name?: string;
  slug?: string;
  status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
}

/**
 * Creates a tenant in the database for E2E tests.
 * Should be called once in `beforeAll` and the returned tenantId
 * passed to all other E2E factories.
 *
 * @example
 * let tenantId: string;
 *
 * beforeAll(async () => {
 *   await app.ready();
 *   const { tenantId: tid } = await createAndSetupTenant();
 *   tenantId = tid;
 * });
 *
 * it('should ...', async () => {
 *   const { token } = await createAndAuthenticateUser(app, { tenantId });
 *   // ...
 * });
 */
export async function createAndSetupTenant(
  options: CreateAndSetupTenantOptions = {},
) {
  const id = randomUUID();
  const timestamp = Date.now();
  const name = options.name ?? `Test Tenant ${timestamp}`;
  const slug =
    options.slug ??
    `test-tenant-${timestamp}-${Math.random().toString(36).substring(2, 6)}`;

  const tenant = await prisma.tenant.create({
    data: {
      id,
      name,
      slug,
      status: options.status ?? 'ACTIVE',
      settings: {},
      metadata: {},
    },
  });

  // Create a default plan and associate it with the tenant
  // so that plan-limits middleware doesn't block requests
  const planId = randomUUID();
  const planName = `Test Plan ${timestamp}-${Math.random().toString(36).substring(2, 6)}`;

  await prisma.plan.create({
    data: {
      id: planId,
      name: planName,
      tier: 'ENTERPRISE',
      price: 0,
      isActive: true,
      maxUsers: 1000,
      maxWarehouses: 1000,
      maxProducts: 100000,
      maxStorageMb: 0,
    },
  });

  await prisma.tenantPlan.create({
    data: {
      tenantId: tenant.id,
      planId,
    },
  });

  // Add all system modules to the plan so module middleware doesn't block
  const allModules = [
    'CORE',
    'STOCK',
    'SALES',
    'HR',
    'PAYROLL',
    'REPORTS',
    'AUDIT',
    'REQUESTS',
    'NOTIFICATIONS',
    'FINANCE',
    'CALENDAR',
    'STORAGE',
    'EMAIL',
    'TASKS',
    'MESSAGING',
    'PRODUCTION',
  ] as const;

  await prisma.planModule.createMany({
    data: allModules.map((mod) => ({
      planId,
      module: mod,
    })),
    skipDuplicates: true,
  });

  return {
    tenant,
    tenantId: tenant.id,
  };
}
