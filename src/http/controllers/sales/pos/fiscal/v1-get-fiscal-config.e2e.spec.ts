import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

/**
 * E2E for `GET /v1/admin/pos/fiscal-config` (Emporion Plan A — Task 32).
 *
 * The endpoint returns the singleton `PosFiscalConfig` row for the requesting
 * tenant, or `{ fiscalConfig: null }` when no configuration has been
 * persisted yet. JWT-protected and gated by the `sales.pos.admin` permission.
 */
describe('Get POS Fiscal Config (E2E)', () => {
  let tenantIdWithoutConfig: string;
  let tenantIdWithConfig: string;
  let adminTokenWithoutConfig: string;
  let adminTokenWithConfig: string;
  let unauthorizedToken: string;

  beforeAll(async () => {
    await app.ready();

    // Tenant A — no fiscal config seeded; exercises the `null` branch.
    const tenantA = await createAndSetupTenant();
    tenantIdWithoutConfig = tenantA.tenantId;
    const authA = await createAndAuthenticateUser(app, {
      tenantId: tenantIdWithoutConfig,
      permissions: ['sales.pos.admin'],
    });
    adminTokenWithoutConfig = authA.token;

    const unauthorizedAuth = await createAndAuthenticateUser(app, {
      tenantId: tenantIdWithoutConfig,
      permissions: ['sales.customers.access'],
    });
    unauthorizedToken = unauthorizedAuth.token;

    // Tenant B — pre-seeded fiscal config; exercises the populated branch.
    const tenantB = await createAndSetupTenant();
    tenantIdWithConfig = tenantB.tenantId;
    const authB = await createAndAuthenticateUser(app, {
      tenantId: tenantIdWithConfig,
      permissions: ['sales.pos.admin'],
    });
    adminTokenWithConfig = authB.token;

    await prisma.posFiscalConfig.create({
      data: {
        tenantId: tenantIdWithConfig,
        enabledDocumentTypes: ['NFC_E'],
        defaultDocumentType: 'NFC_E',
        emissionMode: 'ONLINE_SYNC',
        certificatePath: '/secure/fiscal-e2e.pfx',
        nfceSeries: 1,
        nfceNextNumber: 100,
      },
    });
  });

  it('returns 401 without a JWT', async () => {
    const response = await request(app.server)
      .get('/v1/admin/pos/fiscal-config')
      .send();

    expect([400, 401, 403]).toContain(response.status);
    expect(response.status).not.toBe(200);
  });

  it('returns 403 when the user lacks sales.pos.admin', async () => {
    const response = await request(app.server)
      .get('/v1/admin/pos/fiscal-config')
      .set('Authorization', `Bearer ${unauthorizedToken}`)
      .send();

    expect(response.status).toBe(403);
  });

  it('returns 200 with `fiscalConfig: null` when the tenant has not configured the fiscal subsystem yet', async () => {
    const response = await request(app.server)
      .get('/v1/admin/pos/fiscal-config')
      .set('Authorization', `Bearer ${adminTokenWithoutConfig}`)
      .send();

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('fiscalConfig', null);
  });

  it('returns 200 with the persisted fiscal config when one exists for the tenant', async () => {
    const response = await request(app.server)
      .get('/v1/admin/pos/fiscal-config')
      .set('Authorization', `Bearer ${adminTokenWithConfig}`)
      .send();

    expect(response.status).toBe(200);
    expect(response.body.fiscalConfig).not.toBeNull();
    expect(response.body.fiscalConfig.tenantId).toBe(tenantIdWithConfig);
    expect(response.body.fiscalConfig.defaultDocumentType).toBe('NFC_E');
    expect(response.body.fiscalConfig.emissionMode).toBe('ONLINE_SYNC');
    expect(response.body.fiscalConfig.nfceSeries).toBe(1);
    expect(response.body.fiscalConfig.nfceNextNumber).toBe(100);
    expect(response.body.fiscalConfig.enabledDocumentTypes).toEqual(['NFC_E']);
  });
});
