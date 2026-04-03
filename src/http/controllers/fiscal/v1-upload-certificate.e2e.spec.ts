import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Upload Fiscal Certificate (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });


  it('should return 401 without token', async () => {
    const response = await request(app.server)
      .post('/v1/fiscal/certificates')
      .send({
        pfxPassword: 'test123',
        serialNumber: 'SN123',
        issuer: 'Test CA',
        subject: 'Test Subject',
        validFrom: '2025-01-01T00:00:00Z',
        validUntil: '2026-01-01T00:00:00Z',
      });

    expect(response.status).toBe(401);
  });

  it('should upload a fiscal certificate', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .post('/v1/fiscal/certificates')
      .set('Authorization', `Bearer ${token}`)
      .send({
        pfxPassword: 'test123',
        serialNumber: `SN-${Date.now()}`,
        issuer: 'Test CA Authority',
        subject: 'Test Company LTDA',
        validFrom: '2025-01-01T00:00:00Z',
        validUntil: '2027-01-01T00:00:00Z',
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('certificate');
    expect(response.body.certificate).toHaveProperty('id');
    expect(response.body.certificate).toHaveProperty('serialNumber');
  });
});
