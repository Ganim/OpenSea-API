import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Delete Signature Template (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: seededTenantId } = await createAndSetupTenant();
    tenantId = seededTenantId;
  });

  it('should return 401 without token', async () => {
    const response = await request(app.server).delete(
      '/v1/signature/templates/00000000-0000-0000-0000-000000000000',
    );

    expect(response.status).toBe(401);
  });

  it('should return 404 for non-existent template', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .delete('/v1/signature/templates/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(404);
  });

  it('should delete an existing template and return 204', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const seededTemplate = await prisma.signatureTemplate.create({
      data: {
        tenantId,
        name: 'Template To Delete',
        description: 'Will be removed',
        signatureLevel: 'SIMPLE',
        routingType: 'PARALLEL',
        signerSlots: [
          { order: 1, group: 1, role: 'SIGNER', label: 'Signatário' },
        ],
        expirationDays: null,
        reminderDays: 3,
        isActive: true,
      },
    });

    const response = await request(app.server)
      .delete(`/v1/signature/templates/${seededTemplate.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(204);

    const deletedTemplate = await prisma.signatureTemplate.findUnique({
      where: { id: seededTemplate.id },
    });
    expect(deletedTemplate).toBeNull();
  });
});
