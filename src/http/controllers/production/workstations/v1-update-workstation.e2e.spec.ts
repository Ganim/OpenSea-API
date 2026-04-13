import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Update Workstation (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  it('should update a workstation', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const ts = Date.now();

    // Create a workstation type first
    const typeResponse = await request(app.server)
      .post('/v1/production/workstation-types')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: `Type for WS Update ${ts}`,
      });

    const workstationTypeId = typeResponse.body.workstationType.id;

    // Create a workstation
    const createResponse = await request(app.server)
      .post('/v1/production/workstations')
      .set('Authorization', `Bearer ${token}`)
      .send({
        workstationTypeId,
        code: `WS-UPD-${ts}`,
        name: `Workstation Update ${ts}`,
      });

    const wsId = createResponse.body.workstation.id;

    const response = await request(app.server)
      .put(`/v1/production/workstations/${wsId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: `Workstation Updated ${ts}`,
        description: 'Updated description',
        capacityPerDay: 12,
        costPerHour: 30,
        setupTimeDefault: 20,
        isActive: false,
      });

    expect(response.status).toBe(200);
    expect(response.body.workstation).toEqual(
      expect.objectContaining({
        id: wsId,
        name: `Workstation Updated ${ts}`,
        description: 'Updated description',
        capacityPerDay: 12,
        costPerHour: 30,
        setupTimeDefault: 20,
        isActive: false,
      }),
    );
  });

  it('should return 401 when not authenticated', async () => {
    const response = await request(app.server)
      .put('/v1/production/workstations/00000000-0000-0000-0000-000000000000')
      .send({ name: 'Unauthorized' });

    expect(response.status).toBe(401);
  });
});
