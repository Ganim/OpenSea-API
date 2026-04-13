import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Create Form (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  it('should return 401 without token', async () => {
    const response = await request(app.server)
      .post('/v1/sales/forms')
      .send({ title: 'Test Form' });

    expect(response.status).toBe(401);
  });

  it('should create a form with fields (201)', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const ts = Date.now();

    const response = await request(app.server)
      .post('/v1/sales/forms')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: `Formulario ${ts}`,
        description: 'Formulario de teste E2E',
        fields: [
          {
            label: 'Nome completo',
            type: 'TEXT',
            isRequired: true,
            order: 0,
          },
          {
            label: 'Email',
            type: 'EMAIL',
            isRequired: true,
            order: 1,
          },
          {
            label: 'Telefone',
            type: 'PHONE',
            isRequired: false,
            order: 2,
          },
        ],
      });

    expect(response.status).toBe(201);
    expect(response.body.form).toBeDefined();
    expect(response.body.form.id).toBeDefined();
    expect(response.body.form.title).toContain('Formulario');
    expect(response.body.form.status).toBe('DRAFT');
  });
});
