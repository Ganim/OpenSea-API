import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Get Form By ID (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  it('should return 401 without token', async () => {
    const response = await request(app.server).get(
      '/v1/sales/forms/00000000-0000-0000-0000-000000000001',
    );

    expect(response.status).toBe(401);
  });

  it('should return 404 for non-existent form', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .get('/v1/sales/forms/00000000-0000-0000-0000-000000000001')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(404);
  });

  it('should get a form by ID with fields (200)', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const ts = Date.now();

    // Create a form
    const createRes = await request(app.server)
      .post('/v1/sales/forms')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: `Form Detail ${ts}`,
        fields: [
          { label: 'Campo 1', type: 'TEXT', isRequired: true, order: 0 },
        ],
      });

    const formId = createRes.body.form.id;

    const response = await request(app.server)
      .get(`/v1/sales/forms/${formId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.form).toBeDefined();
    expect(response.body.form.id).toBe(formId);
    expect(response.body.form.title).toContain('Form Detail');
  });
});
