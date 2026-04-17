import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Advance Review Status (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  it('should return 401 when not authenticated', async () => {
    const response = await request(app.server)
      .patch(
        '/v1/hr/performance-reviews/clxxxxxxxxxxxxxxxxxxxxxxxxx/advance-status',
      )
      .send({});
    expect(response.status).toBe(401);
  });

  it('should return 404 for a non-existent review', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const response = await request(app.server)
      .patch(
        '/v1/hr/performance-reviews/clxxxxxxxxxxxxxxxxxxxxxxxxx/advance-status',
      )
      .set('Authorization', `Bearer ${token}`)
      .send({});
    expect(response.status).toBe(404);
  });

  it('REGRESSION: should return 400 when body carries selfScore (strict schema rejects legacy payload)', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const response = await request(app.server)
      .patch(
        '/v1/hr/performance-reviews/clxxxxxxxxxxxxxxxxxxxxxxxxx/advance-status',
      )
      .set('Authorization', `Bearer ${token}`)
      .send({ selfScore: 0 });
    expect(response.status).toBe(400);
  });
});
