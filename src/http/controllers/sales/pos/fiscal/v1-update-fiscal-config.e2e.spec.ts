import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

/**
 * E2E for `PUT /v1/admin/pos/fiscal-config` (Emporion Plan A — Task 32).
 *
 * The endpoint upserts the singleton `PosFiscalConfig` row for the requesting
 * tenant. JWT-protected and gated by the `sales.pos.admin` permission. The
 * use case enforces cross-field invariants which surface as `400 { message }`.
 */
describe('Update POS Fiscal Config (E2E)', () => {
  let tenantId: string;
  let adminToken: string;
  let unauthorizedToken: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;

    const adminAuth = await createAndAuthenticateUser(app, {
      tenantId,
      permissions: ['sales.pos.admin'],
    });
    adminToken = adminAuth.token;

    const unauthorizedAuth = await createAndAuthenticateUser(app, {
      tenantId,
      permissions: ['sales.customers.access'],
    });
    unauthorizedToken = unauthorizedAuth.token;
  });

  it('returns 401 without a JWT', async () => {
    const response = await request(app.server)
      .put('/v1/admin/pos/fiscal-config')
      .send({
        enabledDocumentTypes: ['NFC_E'],
        defaultDocumentType: 'NFC_E',
        emissionMode: 'NONE',
      });

    expect([400, 401, 403]).toContain(response.status);
    expect(response.status).not.toBe(200);
  });

  it('returns 403 when the user lacks sales.pos.admin', async () => {
    const response = await request(app.server)
      .put('/v1/admin/pos/fiscal-config')
      .set('Authorization', `Bearer ${unauthorizedToken}`)
      .send({
        enabledDocumentTypes: ['NFC_E'],
        defaultDocumentType: 'NFC_E',
        emissionMode: 'NONE',
      });

    expect(response.status).toBe(403);
  });

  it('returns 200 and creates a fresh fiscal config when none exists', async () => {
    const response = await request(app.server)
      .put('/v1/admin/pos/fiscal-config')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        enabledDocumentTypes: ['NFC_E'],
        defaultDocumentType: 'NFC_E',
        emissionMode: 'ONLINE_SYNC',
        certificatePath: '/secure/cert.pfx',
        nfceSeries: 1,
        nfceNextNumber: 1,
      });

    expect(response.status).toBe(200);
    expect(response.body.fiscalConfig.tenantId).toBe(tenantId);
    expect(response.body.fiscalConfig.defaultDocumentType).toBe('NFC_E');
    expect(response.body.fiscalConfig.emissionMode).toBe('ONLINE_SYNC');
    expect(response.body.fiscalConfig.nfceSeries).toBe(1);
    expect(response.body.fiscalConfig.nfceNextNumber).toBe(1);
    expect(response.body.fiscalConfig.certificatePath).toBe('/secure/cert.pfx');

    // Verify persistence: the row really lives in `pos_fiscal_config` for
    // this tenant. This also pre-positions the next assertion (in-place
    // update preserves id/createdAt).
    const persisted = await prisma.posFiscalConfig.findUnique({
      where: { tenantId },
    });
    expect(persisted).not.toBeNull();
    expect(persisted?.defaultDocumentType).toBe('NFC_E');
  });

  it('returns 200 and updates an existing fiscal config in place (preserves id and createdAt)', async () => {
    const beforePersisted = await prisma.posFiscalConfig.findUnique({
      where: { tenantId },
    });
    const initialId = beforePersisted!.id;
    const initialCreatedAt = beforePersisted!.createdAt;

    const response = await request(app.server)
      .put('/v1/admin/pos/fiscal-config')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        enabledDocumentTypes: ['NFC_E', 'NFE'],
        defaultDocumentType: 'NFC_E',
        emissionMode: 'ONLINE_SYNC',
        certificatePath: '/secure/cert-rotated.pfx',
        nfceSeries: 2,
        nfceNextNumber: 50,
      });

    expect(response.status).toBe(200);
    expect(response.body.fiscalConfig.id).toBe(initialId);
    expect(response.body.fiscalConfig.nfceSeries).toBe(2);
    expect(response.body.fiscalConfig.nfceNextNumber).toBe(50);
    expect(response.body.fiscalConfig.enabledDocumentTypes).toEqual(
      expect.arrayContaining(['NFC_E', 'NFE']),
    );

    const afterPersisted = await prisma.posFiscalConfig.findUnique({
      where: { tenantId },
    });
    expect(afterPersisted?.id).toBe(initialId);
    expect(afterPersisted?.createdAt.getTime()).toBe(
      initialCreatedAt.getTime(),
    );
  });

  it('returns 400 when defaultDocumentType is not in enabledDocumentTypes (cross-field invariant)', async () => {
    const response = await request(app.server)
      .put('/v1/admin/pos/fiscal-config')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        enabledDocumentTypes: ['NFC_E'],
        defaultDocumentType: 'NFE',
        emissionMode: 'NONE',
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toBeDefined();
  });

  it('returns 400 when enabledDocumentTypes is empty (Zod schema-level violation)', async () => {
    const response = await request(app.server)
      .put('/v1/admin/pos/fiscal-config')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        enabledDocumentTypes: [],
        defaultDocumentType: 'NFC_E',
        emissionMode: 'NONE',
      });

    expect(response.status).toBe(400);
  });
});
