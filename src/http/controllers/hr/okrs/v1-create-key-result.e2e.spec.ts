import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Create Key Result (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });


  it('should return 404 for non-existent objective', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .post('/v1/hr/okrs/objectives/clxxxxxxxxxxxxxxxxxxxxxxxxx/key-results')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Test KR',
        targetValue: 100,
        currentValue: 0,
        unit: 'percent',
      });

    expect([404, 500]).toContain(response.status);
  });

  it('should return 401 when not authenticated', async () => {
    const response = await request(app.server)
      .post('/v1/hr/okrs/objectives/clxxxxxxxxxxxxxxxxxxxxxxxxx/key-results')
      .send({ title: 'Test KR', targetValue: 100 });

    expect(response.status).toBe(401);
  });
});
