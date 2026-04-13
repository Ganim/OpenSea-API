import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Update Workstation Type (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  it('should update a workstation type', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const ts = Date.now();

    // Create a workstation type first
    const createResponse = await request(app.server)
      .post('/v1/production/workstation-types')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: `WS Type Update ${ts}`,
      });

    const typeId = createResponse.body.workstationType.id;

    const response = await request(app.server)
      .put(`/v1/production/workstation-types/${typeId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: `WS Type Updated ${ts}`,
        description: 'Updated description',
        icon: 'cog',
        color: '#AABBCC',
        isActive: false,
      });

    expect(response.status).toBe(200);
    expect(response.body.workstationType).toEqual(
      expect.objectContaining({
        id: typeId,
        name: `WS Type Updated ${ts}`,
        description: 'Updated description',
        icon: 'cog',
        color: '#AABBCC',
        isActive: false,
      }),
    );
  });

  it('should return 401 when not authenticated', async () => {
    const response = await request(app.server)
      .put(
        '/v1/production/workstation-types/00000000-0000-0000-0000-000000000000',
      )
      .send({ name: 'Unauthorized' });

    expect(response.status).toBe(401);
  });
});
