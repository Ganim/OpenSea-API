import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Update Form (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  it('should return 401 without token', async () => {
    const response = await request(app.server)
      .put('/v1/sales/forms/00000000-0000-0000-0000-000000000001')
      .send({ title: 'Updated' });

    expect(response.status).toBe(401);
  });

  it('should update a form (200)', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const ts = Date.now();

    const createRes = await request(app.server)
      .post('/v1/sales/forms')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: `Form Original ${ts}`,
        fields: [
          { label: 'Campo A', type: 'TEXT', isRequired: true, order: 0 },
        ],
      });

    const formId = createRes.body.form.id;

    const response = await request(app.server)
      .put(`/v1/sales/forms/${formId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: `Form Atualizado ${ts}`,
        description: 'Descricao atualizada',
        fields: [
          { label: 'Campo A Atualizado', type: 'TEXT', isRequired: true, order: 0 },
          { label: 'Campo B Novo', type: 'NUMBER', isRequired: false, order: 1 },
        ],
      });

    expect(response.status).toBe(200);
    expect(response.body.form).toBeDefined();
    expect(response.body.form.title).toContain('Form Atualizado');
  });
});
