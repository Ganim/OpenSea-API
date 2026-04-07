import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

describe('List Company Documents (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  it('should list documents for a company (empty if no company)', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .get('/v1/admin/companies/00000000-0000-0000-0000-000000000000/documents')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('documents');
    expect(response.body).toHaveProperty('meta');
    expect(Array.isArray(response.body.documents)).toBe(true);
  });

  it('should return 401 without token', async () => {
    const response = await request(app.server).get(
      '/v1/admin/companies/00000000-0000-0000-0000-000000000000/documents',
    );

    expect(response.status).toBe(401);
  });
});
