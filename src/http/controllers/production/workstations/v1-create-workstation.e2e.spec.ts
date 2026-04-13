import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Create Workstation (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  it('should create a workstation', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const ts = Date.now();

    // Create a workstation type first (required FK)
    const typeResponse = await request(app.server)
      .post('/v1/production/workstation-types')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: `Type for WS Create ${ts}`,
      });

    const workstationTypeId = typeResponse.body.workstationType.id;

    const response = await request(app.server)
      .post('/v1/production/workstations')
      .set('Authorization', `Bearer ${token}`)
      .send({
        workstationTypeId,
        code: `WS-${ts}`,
        name: `Workstation Test ${ts}`,
        description: 'Test workstation description',
        capacityPerDay: 10,
        costPerHour: 25.5,
        setupTimeDefault: 15,
        isActive: true,
      });

    expect(response.status).toBe(201);
    expect(response.body.workstation).toEqual(
      expect.objectContaining({
        workstationTypeId,
        code: `WS-${ts}`,
        name: `Workstation Test ${ts}`,
        description: 'Test workstation description',
        capacityPerDay: 10,
        costPerHour: 25.5,
        setupTimeDefault: 15,
        isActive: true,
      }),
    );
    expect(response.body.workstation.id).toBeDefined();
    expect(response.body.workstation.createdAt).toBeDefined();
  });

  it('should return 401 when not authenticated', async () => {
    const response = await request(app.server)
      .post('/v1/production/workstations')
      .send({
        workstationTypeId: 'some-type-id',
        code: 'WS-UNAUTH',
        name: 'Unauthorized Workstation',
      });

    expect(response.status).toBe(401);
  });
});
