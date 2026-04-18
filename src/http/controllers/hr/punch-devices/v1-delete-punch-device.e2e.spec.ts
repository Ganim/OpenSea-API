import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Delete Punch Device (E2E)', () => {
  let tenantId: string;
  let token: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
    const auth = await createAndAuthenticateUser(app, { tenantId });
    token = auth.token;
  });

  it('should return 404 for non-existent device', async () => {
    const response = await request(app.server)
      .delete('/v1/hr/punch-devices/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(404);
  });

  it('should soft-delete a device (200)', async () => {
    const registerResponse = await request(app.server)
      .post('/v1/hr/punch-devices')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: `Kiosk Delete ${Date.now()}`,
        deviceKind: 'KIOSK_PUBLIC',
      });

    const deviceId = registerResponse.body.deviceId;

    const response = await request(app.server)
      .delete(`/v1/hr/punch-devices/${deviceId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ success: true });

    // After delete, subsequent lookup should 404
    const afterDelete = await request(app.server)
      .get(`/v1/hr/punch-devices/${deviceId}/pairing-code`)
      .set('Authorization', `Bearer ${token}`);

    expect(afterDelete.status).toBe(404);
  });
});
