import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createTerminationE2E } from '@/utils/tests/factories/hr/create-termination.e2e';

describe('Update Termination (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should update termination notes', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const { terminationId } = await createTerminationE2E({ tenantId });

    const response = await request(app.server)
      .patch(`/v1/hr/terminations/${terminationId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        notes: 'Updated notes for termination',
      });

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('termination');
    expect(response.body.termination.id).toBe(terminationId);
  });

  it('should mark termination as paid', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const { terminationId } = await createTerminationE2E({
      tenantId,
      status: 'CALCULATED',
    });

    const response = await request(app.server)
      .patch(`/v1/hr/terminations/${terminationId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        markAsPaid: true,
      });

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('termination');
    expect(response.body.termination.status).toBe('PAID');
  });

  it('should return 404 for non-existent termination', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .patch('/v1/hr/terminations/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${token}`)
      .send({
        notes: 'Should fail',
      });

    expect(response.statusCode).toBe(404);
    expect(response.body).toHaveProperty('message');
  });
});
