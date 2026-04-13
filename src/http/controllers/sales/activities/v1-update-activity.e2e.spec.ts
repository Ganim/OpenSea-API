import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Update Activity (E2E)', () => {
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
      .put('/v1/activities/00000000-0000-0000-0000-000000000001')
      .send({ title: 'Updated' });

    expect(response.status).toBe(401);
  });

  it('should update an activity (200)', async () => {
    const createRes = await request(app.server)
      .post('/v1/activities')
      .set('Authorization', `Bearer ${token}`)
      .send({
        type: 'TASK',
        title: `UpdActivity ${Date.now()}`,
      });

    const activityId = createRes.body.activity.id;

    const response = await request(app.server)
      .put(`/v1/activities/${activityId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: `Updated Activity ${Date.now()}` });

    expect(response.status).toBe(200);
    expect(response.body.activity).toBeDefined();
  });
});
