import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Create Survey (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });


  it('should create a survey', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .post('/v1/hr/surveys')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: `Survey ${Date.now()}`,
        description: 'Employee engagement survey',
        type: 'ENGAGEMENT',
        isAnonymous: true,
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 30 * 86400000).toISOString(),
      });

    expect(response.statusCode).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body.status).toBe('DRAFT');
  });

  it('should return 401 without token', async () => {
    const response = await request(app.server)
      .post('/v1/hr/surveys')
      .send({
        title: 'Test Survey',
        type: 'ENGAGEMENT',
        startDate: new Date().toISOString(),
        endDate: new Date().toISOString(),
      });

    expect(response.statusCode).toBe(401);
  });
});
