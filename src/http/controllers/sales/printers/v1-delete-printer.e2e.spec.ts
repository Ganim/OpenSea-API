import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Delete Printer (E2E)', () => {
  let tenantId: string;
  let token: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
    const auth = await createAndAuthenticateUser(app, { tenantId });
    token = auth.token;
  });

  it('should return 401 without token', async () => {
    const response = await request(app.server).delete(
      '/v1/sales/printers/nonexistent-id',
    );

    expect(response.status).toBe(401);
  });

  it('should delete a printer (204)', async () => {
    const createRes = await request(app.server)
      .post('/v1/sales/printers')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: `DelPrinter ${Date.now()}`,
        type: 'THERMAL',
        connection: 'USB',
        paperWidth: 58,
      });

    const printerId = createRes.body.id;

    const response = await request(app.server)
      .delete(`/v1/sales/printers/${printerId}`)
      .set('Authorization', `Bearer ${token}`);

    expect([200, 204]).toContain(response.status);
  });

  it('should return 404 for non-existent printer', async () => {
    const response = await request(app.server)
      .delete('/v1/sales/printers/nonexistent-id')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(404);
  });
});
