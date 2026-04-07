import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Submit Survey Response (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  it('should submit a survey response', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    // Create survey
    const surveyRes = await request(app.server)
      .post('/v1/hr/surveys')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: `Survey ${Date.now()}`,
        type: 'PULSE',
        isAnonymous: true,
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 30 * 86400000).toISOString(),
      });

    const surveyId = surveyRes.body.id;

    // Add question
    const questionRes = await request(app.server)
      .post(`/v1/hr/surveys/${surveyId}/questions`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        text: 'Rate your satisfaction',
        type: 'RATING_1_5',
        order: 0,
        isRequired: true,
        category: 'ENGAGEMENT',
      });

    const questionId = questionRes.body.id;

    // Activate survey
    await request(app.server)
      .patch(`/v1/hr/surveys/${surveyId}/activate`)
      .set('Authorization', `Bearer ${token}`);

    // Submit response
    const response = await request(app.server)
      .post(`/v1/hr/surveys/${surveyId}/responses`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        answers: [
          {
            questionId,
            ratingValue: 4,
          },
        ],
      });

    expect(response.statusCode).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body).toHaveProperty('surveyId', surveyId);
  });

  it('should return 401 without token', async () => {
    const response = await request(app.server)
      .post('/v1/hr/surveys/nonexistent-id/responses')
      .send({ answers: [] });

    expect(response.statusCode).toBe(401);
  });
});
