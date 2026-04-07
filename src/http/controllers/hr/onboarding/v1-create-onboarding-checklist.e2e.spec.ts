import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createEmployeeE2E } from '@/utils/tests/factories/hr/create-employee.e2e';

describe('Create Onboarding Checklist (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  it('should create an onboarding checklist', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const { employeeId } = await createEmployeeE2E({ tenantId });

    const response = await request(app.server)
      .post('/v1/hr/onboarding')
      .set('Authorization', `Bearer ${token}`)
      .send({
        employeeId,
        title: `Onboarding ${Date.now()}`,
        items: [
          {
            title: 'Setup workstation',
            description: 'Prepare desk and equipment',
          },
          {
            title: 'Meet the team',
            description: 'Introduction to team members',
          },
        ],
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('checklist');
  });

  it('should return 401 when not authenticated', async () => {
    const response = await request(app.server).post('/v1/hr/onboarding').send({
      employeeId: '00000000-0000-0000-0000-000000000000',
      title: 'Test',
    });

    expect(response.status).toBe(401);
  });
});
