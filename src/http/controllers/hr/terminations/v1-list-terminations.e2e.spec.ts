import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createTerminationE2E } from '@/utils/tests/factories/hr/create-termination.e2e';

describe('List Terminations (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });


  it('should list terminations with pagination', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    await createTerminationE2E({ tenantId });
    await createTerminationE2E({ tenantId });

    const response = await request(app.server)
      .get('/v1/hr/terminations')
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('data');
    expect(response.body).toHaveProperty('meta');
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.data.length).toBeGreaterThanOrEqual(2);
    expect(response.body.meta).toHaveProperty('total');
    expect(response.body.meta).toHaveProperty('page');
    expect(response.body.meta).toHaveProperty('limit');
    expect(response.body.meta).toHaveProperty('pages');
  });

  it('should filter terminations by status', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    await createTerminationE2E({ tenantId, status: 'PENDING' });

    const response = await request(app.server)
      .get('/v1/hr/terminations')
      .query({ status: 'PENDING' })
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.data.length).toBeGreaterThanOrEqual(1);

    for (const terminationRecord of response.body.data) {
      expect(terminationRecord.status).toBe('PENDING');
    }
  });
});
