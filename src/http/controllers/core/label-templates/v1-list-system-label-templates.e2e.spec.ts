import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createOrganizationE2E } from '@/utils/tests/factories/core/create-organization.e2e';

describe('List System Label Templates (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
    await createOrganizationE2E();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should list system label templates with correct schema', async () => {
    const { token } = await createAndAuthenticateUser(app);

    const response = await request(app.server)
      .get('/v1/label-templates/system')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('templates');
    expect(Array.isArray(response.body.templates)).toBe(true);
  });
});
