import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createEmployeeE2E } from '@/utils/tests/factories/hr/create-employee.e2e';

describe('List My Absences (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should list my absences with correct schema', async () => {
    const { token, user } = await createAndAuthenticateUser(app);

    await createEmployeeE2E({
      userId: user.user.id,
      fullName: 'Absence Test Employee',
    });

    const response = await request(app.server)
      .get('/v1/me/absences')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('absences');
    expect(Array.isArray(response.body.absences)).toBe(true);
  });
});
