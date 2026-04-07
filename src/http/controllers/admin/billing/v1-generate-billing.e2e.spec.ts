import { app } from '@/app';
import { createAndAuthenticateSuperAdmin } from '@/utils/tests/factories/core/create-and-authenticate-super-admin.e2e';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

describe('Admin Generate Billing (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  it('should generate billing for a tenant', async () => {
    const { token } = await createAndAuthenticateSuperAdmin(app);
    const uniqueMonth = `2025-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}`;

    const response = await request(app.server)
      .post('/v1/admin/billing/generate')
      .set('Authorization', `Bearer ${token}`)
      .send({
        tenantId,
        referenceMonth: uniqueMonth,
        subscriptionTotal: 100,
        consumptionTotal: 50,
        discountsTotal: 10,
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('billing');
    expect(response.body.billing).toHaveProperty('id');
    expect(response.body.billing).toHaveProperty('tenantId', tenantId);
    expect(response.body.billing.status).toBe('PENDING');
  });

  it('should return 403 for non-super-admin user', async () => {
    const { token } = await createAndAuthenticateUser(app);

    const response = await request(app.server)
      .post('/v1/admin/billing/generate')
      .set('Authorization', `Bearer ${token}`)
      .send({
        tenantId,
        referenceMonth: '2025-06',
        subscriptionTotal: 100,
        consumptionTotal: 50,
        dueDate: new Date().toISOString(),
      });

    expect(response.status).toBe(403);
  });
});
