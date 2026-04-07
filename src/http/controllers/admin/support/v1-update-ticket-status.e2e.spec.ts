import { app } from '@/app';
import { createAndAuthenticateSuperAdmin } from '@/utils/tests/factories/core/create-and-authenticate-super-admin.e2e';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

describe('Admin Update Ticket Status (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  it('should return 404 for non-existent ticket', async () => {
    const { token } = await createAndAuthenticateSuperAdmin(app);

    const response = await request(app.server)
      .patch(
        '/v1/admin/support/tickets/00000000-0000-0000-0000-000000000000/status',
      )
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'IN_PROGRESS' });

    expect(response.status).toBe(404);
  });

  it('should return 403 for non-super-admin user', async () => {
    const { token } = await createAndAuthenticateUser(app);

    const response = await request(app.server)
      .patch(
        '/v1/admin/support/tickets/00000000-0000-0000-0000-000000000000/status',
      )
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'IN_PROGRESS' });

    expect(response.status).toBe(403);
  });
});
