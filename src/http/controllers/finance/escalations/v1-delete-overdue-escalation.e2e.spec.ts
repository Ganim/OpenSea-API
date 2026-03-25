import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Delete Overdue Escalation (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should soft-delete an escalation template', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    // Create first
    const createResponse = await request(app.server)
      .post('/v1/finance/escalations')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Delete Test',
        steps: [
          {
            daysOverdue: 1,
            channel: 'EMAIL',
            templateType: 'FRIENDLY_REMINDER',
            message: 'To be deleted',
            order: 1,
          },
        ],
      });

    const escalationId = createResponse.body.escalation.id;

    const response = await request(app.server)
      .delete(`/v1/finance/escalations/${escalationId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(204);
  });

  it('should return 401 without auth', async () => {
    const response = await request(app.server).delete(
      '/v1/finance/escalations/00000000-0000-0000-0000-000000000000',
    );
    expect(response.status).toBe(401);
  });
});
