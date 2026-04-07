import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

describe('Create Company Document (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  it('should return 400 when company does not exist', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .post(
        '/v1/admin/companies/00000000-0000-0000-0000-000000000000/documents',
      )
      .set('Authorization', `Bearer ${token}`)
      .field('documentType', 'CONTRACT')
      .attach('file', Buffer.from('test-content'), {
        filename: 'test.pdf',
        contentType: 'application/pdf',
      });

    expect(response.status).toBe(400);
  });

  it('should return 401 without token', async () => {
    const response = await request(app.server)
      .post(
        '/v1/admin/companies/00000000-0000-0000-0000-000000000000/documents',
      )
      .field('documentType', 'CONTRACT')
      .attach('file', Buffer.from('test-content'), {
        filename: 'test.pdf',
        contentType: 'application/pdf',
      });

    expect(response.status).toBe(401);
  });
});
