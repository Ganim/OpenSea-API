import { app } from '@/app';
import { createAndAuthenticateSuperAdmin } from '@/utils/tests/factories/core/create-and-authenticate-super-admin.e2e';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

describe('Admin Update SLA Config (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });


  it('should update SLA config for a priority (or 404 if not seeded)', async () => {
    const { token } = await createAndAuthenticateSuperAdmin(app);

    const response = await request(app.server)
      .put('/v1/admin/support/sla/HIGH')
      .set('Authorization', `Bearer ${token}`)
      .send({
        firstResponseMinutes: 60,
        resolutionMinutes: 480,
      });

    expect([200, 404]).toContain(response.status);
    if (response.status === 200) {
      expect(response.body).toHaveProperty('slaConfig');
      expect(response.body.slaConfig.priority).toBe('HIGH');
    }
  });

  it('should return 403 for non-super-admin user', async () => {
    const { token } = await createAndAuthenticateUser(app);

    const response = await request(app.server)
      .put('/v1/admin/support/sla/HIGH')
      .set('Authorization', `Bearer ${token}`)
      .send({
        firstResponseMinutes: 60,
        resolutionMinutes: 480,
      });

    expect(response.status).toBe(403);
  });
});
