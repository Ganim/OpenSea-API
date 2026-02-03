import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createEmployeeE2E } from '@/utils/tests/factories/hr/create-employee.e2e';
import { createPositionE2E } from '@/utils/tests/factories/hr/create-position.e2e';

describe('List Positions (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should list positions with correct schema', async () => {
    const { token } = await createAndAuthenticateUser(app);
    const { employee } = await createEmployeeE2E();
    await createPositionE2E({ tenantId: employee.tenantId });

    const response = await request(app.server)
      .get('/v1/hr/positions')
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('positions');
    expect(response.body).toHaveProperty('meta');
    expect(Array.isArray(response.body.positions)).toBe(true);
  });
});
