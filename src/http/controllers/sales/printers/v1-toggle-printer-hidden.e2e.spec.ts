import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Toggle Printer Hidden (E2E)', () => {
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
    const response = await request(app.server)
      .patch('/v1/sales/printers/some-id/hidden')
      .send({ isHidden: true });

    expect(response.status).toBe(401);
  });

  it('should toggle printer hidden status (200)', async () => {
    const createRes = await request(app.server)
      .post('/v1/sales/printers')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: `HiddenPrinter ${Date.now()}`,
        type: 'INKJET',
        connection: 'USB',
        paperWidth: 80,
      });

    const printerId = createRes.body.id;

    const response = await request(app.server)
      .patch(`/v1/sales/printers/${printerId}/hidden`)
      .set('Authorization', `Bearer ${token}`)
      .send({ isHidden: true });

    expect(response.status).toBe(200);
    expect(response.body.id).toBe(printerId);
    expect(response.body.isHidden).toBe(true);
  });
});
