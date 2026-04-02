import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Activate Survey (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should activate a survey with questions', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    // Create survey
    const createResponse = await request(app.server)
      .post('/v1/hr/surveys')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: `Survey ${Date.now()}`,
        type: 'ENGAGEMENT',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 30 * 86400000).toISOString(),
      });

    const surveyId = createResponse.body.id;

    // Add a question (required for activation)
    await request(app.server)
      .post(`/v1/hr/surveys/${surveyId}/questions`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        text: 'How satisfied are you?',
        type: 'RATING_1_5',
        order: 0,
        isRequired: true,
        category: 'ENGAGEMENT',
      });

    const response = await request(app.server)
      .patch(`/v1/hr/surveys/${surveyId}/activate`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.status).toBe('ACTIVE');
  });

  it('should return 401 without token', async () => {
    const response = await request(app.server)
      .patch('/v1/hr/surveys/nonexistent-id/activate');

    expect(response.statusCode).toBe(401);
  });
});
