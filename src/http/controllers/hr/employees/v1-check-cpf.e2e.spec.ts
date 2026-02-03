import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import {
  generateEmployeeData,
  generateValidCPF,
} from '@/utils/tests/factories/hr/create-employee.e2e';

describe('Check CPF (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const tenant = await createAndSetupTenant();
    tenantId = tenant.tenantId;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should check cpf with correct schema', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const cpf = generateValidCPF();

    await request(app.server)
      .post('/v1/hr/employees')
      .set('Authorization', `Bearer ${token}`)
      .send(generateEmployeeData({ cpf }));

    const response = await request(app.server)
      .post('/v1/hr/employees/check-cpf')
      .set('Authorization', `Bearer ${token}`)
      .send({ cpf });

    expect(response.statusCode).toBe(200);
    expect(response.body.exists).toBe(true);
    expect(response.body.employeeId).toBeDefined();
  });
});
