import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Get Overdue Escalation By ID (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  it('should get an escalation by id with steps', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    // Create an escalation first
    const createResponse = await request(app.server)
      .post('/v1/finance/escalations')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Get By ID Test',
        steps: [
          {
            daysOverdue: 1,
            channel: 'EMAIL',
            templateType: 'FRIENDLY_REMINDER',
            message: 'Test message',
            order: 1,
          },
        ],
      });

    const escalationId = createResponse.body.escalation.id;

    const response = await request(app.server)
      .get(`/v1/finance/escalations/${escalationId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.escalation.id).toBe(escalationId);
    expect(response.body.escalation.steps).toHaveLength(1);
  });

  it('should return 401 without auth', async () => {
    const response = await request(app.server).get(
      '/v1/finance/escalations/00000000-0000-0000-0000-000000000000',
    );
    expect(response.status).toBe(401);
  });
});
