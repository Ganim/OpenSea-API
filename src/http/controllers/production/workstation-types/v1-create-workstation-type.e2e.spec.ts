import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Create Workstation Type (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  it('should create a workstation type', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const ts = Date.now();

    const response = await request(app.server)
      .post('/v1/production/workstation-types')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: `Workstation Type ${ts}`,
        description: 'Test workstation type description',
        icon: 'wrench',
        color: '#FF5733',
        isActive: true,
      });

    expect(response.status).toBe(201);
    expect(response.body.workstationType).toEqual(
      expect.objectContaining({
        name: `Workstation Type ${ts}`,
        description: 'Test workstation type description',
        icon: 'wrench',
        color: '#FF5733',
        isActive: true,
      }),
    );
    expect(response.body.workstationType.id).toBeDefined();
    expect(response.body.workstationType.createdAt).toBeDefined();
  });

  it('should return 401 when not authenticated', async () => {
    const response = await request(app.server)
      .post('/v1/production/workstation-types')
      .send({
        name: 'Unauthorized Type',
      });

    expect(response.status).toBe(401);
  });
});
