import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createEmployeeE2E } from '@/utils/tests/factories/hr/create-employee.e2e';
import { createPositionE2E } from '@/utils/tests/factories/hr/create-position.e2e';

describe('Update Position (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should update position with correct schema', async () => {
    const { token } = await createAndAuthenticateUser(app);
    const { employee } = await createEmployeeE2E();
    const { positionId } = await createPositionE2E({ tenantId: employee.tenantId });
    const updateData = { name: 'Updated Position Name' };

    const response = await request(app.server)
      .put(`/v1/hr/positions/${positionId}`)
      .set('Authorization', `Bearer ${token}`)
      .send(updateData);

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('position');
    expect(response.body.position.name).toBe(updateData.name);
  });
});
