import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createDepartmentE2E } from '@/utils/tests/factories/hr/create-department.e2e';

describe('Delete Department (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should delete department with correct schema', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const { departmentId } = await createDepartmentE2E({ tenantId });

    const response = await request(app.server)
      .delete(`/v1/hr/departments/${departmentId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(204);
  });
});
