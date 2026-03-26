import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Forms (E2E)', () => {
  let tenantId: string;
  let token: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
    const auth = await createAndAuthenticateUser(app, { tenantId });
    token = auth.token;
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /v1/sales/forms should create a form (201)', async () => {
    const timestamp = Date.now();

    const response = await request(app.server)
      .post('/v1/sales/forms')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: `Form ${timestamp}`,
        description: 'Test form description',
        fields: [
          {
            label: 'Full Name',
            type: 'TEXT',
            isRequired: true,
            order: 0,
          },
          {
            label: 'Email Address',
            type: 'EMAIL',
            isRequired: true,
            order: 1,
          },
          {
            label: 'Comments',
            type: 'TEXTAREA',
            isRequired: false,
            order: 2,
          },
        ],
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('form');
    expect(response.body.form).toHaveProperty('id');
    expect(response.body.form.title).toBe(`Form ${timestamp}`);
  });

  it('GET /v1/sales/forms should list forms (200)', async () => {
    const response = await request(app.server)
      .get('/v1/sales/forms')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('forms');
    expect(response.body).toHaveProperty('total');
    expect(Array.isArray(response.body.forms)).toBe(true);
  });

  it('GET /v1/sales/forms/:id should get form by id (200)', async () => {
    const createResponse = await request(app.server)
      .post('/v1/sales/forms')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: `Form GetById ${Date.now()}`,
        fields: [
          {
            label: 'Name',
            type: 'TEXT',
            isRequired: true,
            order: 0,
          },
        ],
      });

    const formId = createResponse.body.form.id;

    const response = await request(app.server)
      .get(`/v1/sales/forms/${formId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('form');
    expect(response.body.form.id).toBe(formId);
  });

  it('DELETE /v1/sales/forms/:id should soft delete a form (204)', async () => {
    const createResponse = await request(app.server)
      .post('/v1/sales/forms')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: `Form Delete ${Date.now()}`,
        fields: [
          {
            label: 'Field',
            type: 'TEXT',
            isRequired: false,
            order: 0,
          },
        ],
      });

    const formId = createResponse.body.form.id;

    const response = await request(app.server)
      .delete(`/v1/sales/forms/${formId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(204);
  });
});
