import { app } from '@/app';
import { createAndAuthenticateSuperAdmin } from '@/utils/tests/factories/core/create-and-authenticate-super-admin.e2e';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

describe('Admin Invite Central User (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should return 404 for non-existent user', async () => {
    const { token } = await createAndAuthenticateSuperAdmin(app);

    const response = await request(app.server)
      .post('/v1/admin/team/invite')
      .set('Authorization', `Bearer ${token}`)
      .send({
        userId: '00000000-0000-0000-0000-000000000000',
        role: 'SUPPORT',
      });

    expect(response.status).toBe(404);
  });

  it('should return 403 for non-super-admin user', async () => {
    const { token } = await createAndAuthenticateUser(app);

    const response = await request(app.server)
      .post('/v1/admin/team/invite')
      .set('Authorization', `Bearer ${token}`)
      .send({
        userId: '00000000-0000-0000-0000-000000000000',
        role: 'SUPPORT',
      });

    expect(response.status).toBe(403);
  });
});
