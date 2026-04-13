import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Create Cadence Sequence (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  it('should return 401 without token', async () => {
    const response = await request(app.server)
      .post('/v1/sales/cadences')
      .send({ name: 'Test Cadence' });

    expect(response.status).toBe(401);
  });

  it('should create a cadence sequence (201)', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const ts = Date.now();

    const response = await request(app.server)
      .post('/v1/sales/cadences')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: `Cadencia ${ts}`,
        description: 'Cadencia de follow-up',
        steps: [
          {
            order: 1,
            type: 'EMAIL',
            delayDays: 0,
            config: { subject: 'Primeiro contato' },
          },
          { order: 2, type: 'WAIT', delayDays: 3, config: {} },
          {
            order: 3,
            type: 'CALL',
            delayDays: 0,
            config: { script: 'Follow-up call' },
          },
        ],
      });

    expect(response.status).toBe(201);
    expect(response.body.cadenceSequence).toBeDefined();
    expect(response.body.cadenceSequence.id).toBeDefined();
    expect(response.body.cadenceSequence.name).toContain('Cadencia');
    expect(response.body.cadenceSequence.steps).toBeDefined();
    expect(response.body.cadenceSequence.steps.length).toBe(3);
  });
});
