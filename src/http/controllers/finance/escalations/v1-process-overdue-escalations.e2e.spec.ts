import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Process Overdue Escalations (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  it('should process overdue entries against escalation rules', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .post('/v1/finance/escalations/process')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('processed');
    expect(response.body).toHaveProperty('actionsCreated');
    expect(response.body).toHaveProperty('errors');
    expect(typeof response.body.processed).toBe('number');
  });

  it('should return 401 without auth', async () => {
    const response = await request(app.server).post(
      '/v1/finance/escalations/process',
    );
    expect(response.status).toBe(401);
  });
});
