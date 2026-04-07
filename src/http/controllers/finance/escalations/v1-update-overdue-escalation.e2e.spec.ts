import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Update Overdue Escalation (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  it('should update an escalation template', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    // Create first
    const createResponse = await request(app.server)
      .post('/v1/finance/escalations')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Update Test Original',
        steps: [
          {
            daysOverdue: 1,
            channel: 'EMAIL',
            templateType: 'FRIENDLY_REMINDER',
            message: 'Original message',
            order: 1,
          },
        ],
      });

    const escalationId = createResponse.body.escalation.id;

    // Update
    const response = await request(app.server)
      .patch(`/v1/finance/escalations/${escalationId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Update Test Updated',
        isDefault: true,
      });

    expect(response.status).toBe(200);
    expect(response.body.escalation.name).toBe('Update Test Updated');
    expect(response.body.escalation.isDefault).toBe(true);
  });

  it('should return 401 without auth', async () => {
    const response = await request(app.server)
      .patch('/v1/finance/escalations/00000000-0000-0000-0000-000000000000')
      .send({ name: 'No Auth' });
    expect(response.status).toBe(401);
  });
});
