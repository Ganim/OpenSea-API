import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createTerminationE2E } from '@/utils/tests/factories/hr/create-termination.e2e';

describe('Get Termination (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  it('should get termination by id', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const { terminationId } = await createTerminationE2E({ tenantId });

    const response = await request(app.server)
      .get(`/v1/hr/terminations/${terminationId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('termination');
    expect(response.body.termination.id).toBe(terminationId);
    expect(response.body.termination).toHaveProperty('type');
    expect(response.body.termination).toHaveProperty('terminationDate');
    expect(response.body.termination).toHaveProperty('lastWorkDay');
    expect(response.body.termination).toHaveProperty('noticeType');
    expect(response.body.termination).toHaveProperty('status');
  });

  it('should return 404 for non-existent termination', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .get('/v1/hr/terminations/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(404);
    expect(response.body).toHaveProperty('message');
  });
});
