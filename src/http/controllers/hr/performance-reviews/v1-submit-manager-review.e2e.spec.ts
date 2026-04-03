import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Submit Manager Review (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const response = await request(app.server)
      .patch('/v1/hr/performance-reviews/clxxxxxxxxxxxxxxxxxxxxxxxxx/manager-review')
      .set('Authorization', `Bearer ${token}`)
      .send({ score: 8, feedback: 'Good performance' });
    expect(response.status).toBe(404);
  });

  it('should return 401 when not authenticated', async () => {
    const response = await request(app.server)
      .patch('/v1/hr/performance-reviews/clxxxxxxxxxxxxxxxxxxxxxxxxx/manager-review')
      .send({ score: 8 });
    expect(response.status).toBe(401);
  });
});
