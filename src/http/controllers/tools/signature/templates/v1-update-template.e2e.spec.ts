import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Update Signature Template (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: seededTenantId } = await createAndSetupTenant();
    tenantId = seededTenantId;
  });

  it('should return 401 without token', async () => {
    const response = await request(app.server)
      .patch('/v1/signature/templates/00000000-0000-0000-0000-000000000000')
      .send({ name: 'New Name' });

    expect(response.status).toBe(401);
  });

  it('should return 404 for non-existent template', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .patch('/v1/signature/templates/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Does not matter' });

    expect(response.status).toBe(404);
  });

  it('should apply partial update and return 200', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const seededTemplate = await prisma.signatureTemplate.create({
      data: {
        tenantId,
        name: 'Original Template',
        description: 'Original description',
        signatureLevel: 'ADVANCED',
        routingType: 'SEQUENTIAL',
        signerSlots: [
          { order: 1, group: 1, role: 'SIGNER', label: 'Signatário' },
        ],
        expirationDays: 30,
        reminderDays: 7,
        isActive: true,
      },
    });

    const response = await request(app.server)
      .patch(`/v1/signature/templates/${seededTemplate.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Renamed Template',
        isActive: false,
      });

    expect(response.status).toBe(200);
    expect(response.body.template).toBeDefined();
    expect(response.body.template.id).toBe(seededTemplate.id);
    expect(response.body.template.name).toBe('Renamed Template');
    expect(response.body.template.isActive).toBe(false);
    // Untouched fields preserved
    expect(response.body.template.signatureLevel).toBe('ADVANCED');
    expect(response.body.template.routingType).toBe('SEQUENTIAL');
  });
});
