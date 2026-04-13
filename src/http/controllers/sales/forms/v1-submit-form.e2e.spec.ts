import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Submit Form (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  it('should return 401 without token', async () => {
    const response = await request(app.server)
      .post('/v1/sales/forms/00000000-0000-0000-0000-000000000001/submit')
      .send({ data: {} });

    expect(response.status).toBe(401);
  });

  it('should submit data to a published form (201)', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const ts = Date.now();

    // Create and publish form
    const createRes = await request(app.server)
      .post('/v1/sales/forms')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: `Form Submit ${ts}`,
        fields: [
          { label: 'Nome', type: 'TEXT', isRequired: true, order: 0 },
          { label: 'Email', type: 'EMAIL', isRequired: false, order: 1 },
        ],
      });

    const formId = createRes.body.form.id;

    await request(app.server)
      .patch(`/v1/sales/forms/${formId}/publish`)
      .set('Authorization', `Bearer ${token}`);

    // Submit
    const response = await request(app.server)
      .post(`/v1/sales/forms/${formId}/submit`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        data: {
          Nome: `Teste ${ts}`,
          Email: `teste-${ts}@example.com`,
        },
      });

    expect(response.status).toBe(201);
    expect(response.body.submission).toBeDefined();
    expect(response.body.submission.id).toBeDefined();
    expect(response.body.submission.formId).toBe(formId);
  });
});
