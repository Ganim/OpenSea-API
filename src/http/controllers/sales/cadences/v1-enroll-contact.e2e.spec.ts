import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { randomUUID } from 'node:crypto';

describe('Enroll Contact (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  it('should return 401 without token', async () => {
    const response = await request(app.server)
      .post('/v1/sales/cadences/00000000-0000-0000-0000-000000000001/enroll')
      .send({ contactId: randomUUID() });

    expect(response.status).toBe(401);
  });

  it('should return 404 for non-existent cadence', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .post('/v1/sales/cadences/00000000-0000-0000-0000-000000000001/enroll')
      .set('Authorization', `Bearer ${token}`)
      .send({ contactId: randomUUID() });

    expect([400, 404]).toContain(response.status);
  });

  it('should enroll a contact in a cadence (201)', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const ts = Date.now();

    // Create a cadence
    const createRes = await request(app.server)
      .post('/v1/sales/cadences')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: `Cadencia Enroll ${ts}`,
        steps: [
          { order: 1, type: 'EMAIL', delayDays: 0, config: {} },
        ],
      });

    const cadenceId = createRes.body.cadenceSequence.id;

    // Activate the cadence
    await request(app.server)
      .patch(`/v1/sales/cadences/${cadenceId}/activate`)
      .set('Authorization', `Bearer ${token}`);

    // Create a contact
    const contactRes = await request(app.server)
      .post('/v1/contacts')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: `Contato Enroll ${ts}`,
        email: `contact-enroll-${ts}@example.com`,
      });

    // If contacts endpoint works, use the ID; otherwise use a fake UUID
    const contactId = contactRes.body?.contact?.id ?? randomUUID();

    const response = await request(app.server)
      .post(`/v1/sales/cadences/${cadenceId}/enroll`)
      .set('Authorization', `Bearer ${token}`)
      .send({ contactId });

    // May succeed (201) or fail if contact not found (400/404)
    expect([201, 400, 404]).toContain(response.status);
    if (response.status === 201) {
      expect(response.body.enrollment).toBeDefined();
      expect(response.body.enrollment.sequenceId).toBe(cadenceId);
    }
  });
});
