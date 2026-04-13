import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Delete Combo (E2E)', () => {
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
      '/v1/combos/00000000-0000-0000-0000-000000000001',
    );

    expect(response.status).toBe(401);
  });

  it('should delete a combo (200)', async () => {
    const createRes = await request(app.server)
      .post('/v1/combos')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: `Combo Del ${Date.now()}`,
        type: 'FIXED',
        discountType: 'PERCENTAGE',
        discountValue: 10,
      });

    const comboId = createRes.body.combo.id;

    const response = await request(app.server)
      .delete(`/v1/combos/${comboId}`)
      .set('Authorization', `Bearer ${token}`);

    expect([200, 204]).toContain(response.status);
  });
});
