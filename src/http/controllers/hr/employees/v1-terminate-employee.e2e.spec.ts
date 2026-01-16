import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createEmployeeE2E } from '@/utils/tests/factories/hr/create-employee.e2e';

describe('Terminate Employee (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should terminate employee with correct schema', async () => {
    const { token } = await createAndAuthenticateUser(app);
    const { employee } = await createEmployeeE2E({ status: 'ACTIVE' });

    const response = await request(app.server)
      .post(`/v1/hr/employees/${employee.id}/terminate`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        terminationDate: new Date().toISOString(),
        reason: 'Pedido de demissão',
      });

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('employee');
    expect(response.body.employee.status).toBe('TERMINATED');
  });
});
