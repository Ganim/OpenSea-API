import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Get Survey (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });


  it('should get a survey by ID', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const createResponse = await request(app.server)
      .post('/v1/hr/surveys')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: `Survey ${Date.now()}`,
        type: 'PULSE',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 86400000).toISOString(),
      });

    const surveyId = createResponse.body.id;

    const response = await request(app.server)
      .get(`/v1/hr/surveys/${surveyId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('id', surveyId);
  });

  it('should return 401 without token', async () => {
    const response = await request(app.server)
      .get('/v1/hr/surveys/nonexistent-id');

    expect(response.statusCode).toBe(401);
  });
});
