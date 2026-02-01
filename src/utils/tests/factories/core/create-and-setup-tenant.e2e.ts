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

  return {
    tenant,
    tenantId: tenant.id,
  };
}
