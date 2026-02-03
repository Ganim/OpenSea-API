import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createDepartmentE2E } from '@/utils/tests/factories/hr/create-department.e2e';

describe('List Departments (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should list departments with correct schema', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    await createDepartmentE2E({ tenantId });

    const response = await request(app.server)
      .get('/v1/hr/departments')
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('departments');
    expect(response.body).toHaveProperty('meta');
    expect(Array.isArray(response.body.departments)).toBe(true);
  });
});
