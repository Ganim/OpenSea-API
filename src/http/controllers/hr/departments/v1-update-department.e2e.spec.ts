import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createDepartmentE2E } from '@/utils/tests/factories/hr/create-department.e2e';

describe('Update Department (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should update department with correct schema', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const { departmentId } = await createDepartmentE2E({ tenantId });
    const updateData = { name: 'Updated Department Name' };

    const response = await request(app.server)
      .put(`/v1/hr/departments/${departmentId}`)
      .set('Authorization', `Bearer ${token}`)
      .send(updateData);

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('department');
    expect(response.body.department.name).toBe(updateData.name);
  });
});
