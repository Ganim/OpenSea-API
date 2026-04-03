import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Create Survey Question (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });


  it('should add a question to a survey', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const surveyRes = await request(app.server)
      .post('/v1/hr/surveys')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: `Survey ${Date.now()}`,
        type: 'ENGAGEMENT',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 86400000).toISOString(),
      });

    const surveyId = surveyRes.body.id;

    const response = await request(app.server)
      .post(`/v1/hr/surveys/${surveyId}/questions`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        text: 'How would you rate your work-life balance?',
        type: 'RATING_1_5',
        order: 0,
        isRequired: true,
        category: 'WORK_LIFE',
      });

    expect(response.statusCode).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body.text).toBe('How would you rate your work-life balance?');
  });

  it('should return 401 without token', async () => {
    const response = await request(app.server)
      .post('/v1/hr/surveys/nonexistent-id/questions')
      .send({
        text: 'Test',
        type: 'RATING_1_5',
        order: 0,
        category: 'CUSTOM',
      });

    expect(response.statusCode).toBe(401);
  });
});
