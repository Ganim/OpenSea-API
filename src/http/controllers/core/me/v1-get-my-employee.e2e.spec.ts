import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createEmployeeE2E } from '@/utils/tests/factories/hr/create-employee.e2e';

describe('Get My Employee (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should get my employee with correct schema', async () => {
    const { token, user } = await createAndAuthenticateUser(app);

    await createEmployeeE2E({
      userId: user.user.id,
      fullName: 'Test Employee',
    });

    const response = await request(app.server)
      .get('/v1/me/employee')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('employee');
  });
});
