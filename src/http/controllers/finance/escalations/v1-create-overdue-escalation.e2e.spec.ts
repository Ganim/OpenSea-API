import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Create Overdue Escalation (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });


  it('should create an escalation template with steps', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .post('/v1/finance/escalations')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'E2E Escalation',
        isDefault: true,
        steps: [
          {
            daysOverdue: 1,
            channel: 'EMAIL',
            templateType: 'FRIENDLY_REMINDER',
            subject: 'Lembrete',
            message: 'Olá {customerName}',
            order: 1,
          },
          {
            daysOverdue: 7,
            channel: 'SYSTEM_ALERT',
            templateType: 'URGENT_NOTICE',
            message: 'ALERTA: {entryCode}',
            order: 2,
          },
        ],
      });

    expect(response.status).toBe(201);
    expect(response.body.escalation).toBeDefined();
    expect(response.body.escalation.name).toBe('E2E Escalation');
    expect(response.body.escalation.isDefault).toBe(true);
    expect(response.body.escalation.steps).toHaveLength(2);
  });

  it('should return 401 without auth', async () => {
    const response = await request(app.server)
      .post('/v1/finance/escalations')
      .send({
        name: 'No Auth',
        steps: [
          {
            daysOverdue: 1,
            channel: 'EMAIL',
            templateType: 'FRIENDLY_REMINDER',
            message: 'Test',
            order: 1,
          },
        ],
      });

    expect(response.status).toBe(401);
  });
});
