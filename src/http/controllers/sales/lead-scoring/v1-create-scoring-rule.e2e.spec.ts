import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Create Scoring Rule (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });


  it('should create a scoring rule', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const timestamp = Date.now();

    const response = await request(app.server)
      .post('/v1/sales/lead-scoring/rules')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: `Scoring Rule ${timestamp}`,
        field: 'revenue',
        condition: 'greater_than',
        value: '10000',
        points: 10,
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('scoringRule');
    expect(response.body.scoringRule).toHaveProperty('name');
  });

  it('should return 401 without token', async () => {
    const response = await request(app.server)
      .post('/v1/sales/lead-scoring/rules')
      .send({
        name: 'No Auth',
        field: 'revenue',
        condition: 'gt',
        value: '10000',
        points: 10,
      });

    expect(response.status).toBe(401);
  });
});
