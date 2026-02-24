import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndAuthenticateSuperAdmin } from '@/utils/tests/factories/core/create-and-authenticate-super-admin.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Migrate Finance Attachments (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should migrate finance attachments as super admin', async () => {
    const { token } = await createAndAuthenticateSuperAdmin(app);

    const response = await request(app.server)
      .post('/v1/admin/storage/migrate-finance-attachments')
      .set('Authorization', `Bearer ${token}`)
      .send({ tenantId });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('migratedCount');
    expect(response.body).toHaveProperty('skippedCount');
    expect(response.body).toHaveProperty('totalAttachments');
    expect(typeof response.body.migratedCount).toBe('number');
  });

  it('should return 403 for non-super-admin', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .post('/v1/admin/storage/migrate-finance-attachments')
      .set('Authorization', `Bearer ${token}`)
      .send({ tenantId });

    expect(response.status).toBe(403);
  });

  it('should return 401 without auth', async () => {
    const response = await request(app.server)
      .post('/v1/admin/storage/migrate-finance-attachments')
      .send({ tenantId });

    expect(response.status).toBe(401);
  });
});
