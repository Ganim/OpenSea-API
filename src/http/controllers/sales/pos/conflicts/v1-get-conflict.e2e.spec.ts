import { randomUUID } from 'node:crypto';

import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createEmployeeE2E } from '@/utils/tests/factories/hr/create-employee.e2e';
import { createProduct } from '@/utils/tests/factories/stock/create-product.e2e';
import { createVariant } from '@/utils/tests/factories/stock/create-variant.e2e';

/**
 * E2E for `GET /v1/admin/pos/conflicts/:id` (Plan B F-01).
 *
 * Returns a single conflict enriched with terminal name, operator name +
 * shortId, the resolver user's display name, and per-detail `variantName`.
 */
describe('Get POS Conflict (E2E)', () => {
  let tenantId: string;
  let adminToken: string;
  let unauthorizedToken: string;
  let terminalId: string;
  let operatorEmployeeId: string;
  let pendingConflictId: string;
  let resolvedConflictId: string;
  let variantName: string;
  let variantId: string;
  let resolvedByUserId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;

    const adminAuth = await createAndAuthenticateUser(app, {
      tenantId,
      permissions: [
        'sales.pos.admin',
        'sales.pos.terminals.register',
        'hr.employees.admin',
        'hr.employees.register',
      ],
    });
    adminToken = adminAuth.token;
    resolvedByUserId = adminAuth.user.user.id;

    const unauthorizedAuth = await createAndAuthenticateUser(app, {
      tenantId,
      permissions: ['sales.customers.access'],
    });
    unauthorizedToken = unauthorizedAuth.token;

    const createTerminalResponse = await request(app.server)
      .post('/v1/pos/terminals')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        terminalName: `Get Conflict E2E ${Date.now()}`,
        mode: 'SALES_ONLY',
      });
    expect(createTerminalResponse.status).toBe(201);
    terminalId = createTerminalResponse.body.terminal.id;

    const { employee } = await createEmployeeE2E({
      tenantId,
      status: 'ACTIVE',
    });
    operatorEmployeeId = employee.id;

    // Seed a Variant via the test factories so the use case can enrich
    // `variantName` (Product/Variant require many derived fields like
    // fullCode/barcode/EAN that the factories generate for us).
    const { product } = await createProduct({
      tenantId,
      name: `Produto Conflict ${Date.now()}`,
    });
    variantName = `Variante Conflict ${Date.now()}`;
    const { variant } = await createVariant({
      tenantId,
      productId: product.id,
      name: variantName,
    });
    variantId = variant.id;

    pendingConflictId = randomUUID();
    await prisma.posOrderConflict.create({
      data: {
        id: pendingConflictId,
        tenantId,
        saleLocalUuid: randomUUID(),
        posTerminalId: terminalId,
        posSessionId: null,
        posOperatorEmployeeId: operatorEmployeeId,
        status: 'PENDING_RESOLUTION',
        conflictDetails: [
          {
            itemId: randomUUID(),
            variantId,
            requestedQuantity: 5,
            availableQuantity: 2,
            shortage: 3,
            reason: 'INSUFFICIENT_STOCK',
          },
        ],
      },
    });

    resolvedConflictId = randomUUID();
    await prisma.posOrderConflict.create({
      data: {
        id: resolvedConflictId,
        tenantId,
        saleLocalUuid: randomUUID(),
        posTerminalId: terminalId,
        posSessionId: null,
        posOperatorEmployeeId: operatorEmployeeId,
        status: 'CANCELED_REFUNDED',
        conflictDetails: [
          {
            itemId: randomUUID(),
            variantId,
            requestedQuantity: 1,
            availableQuantity: 0,
            shortage: 1,
            reason: 'INSUFFICIENT_STOCK',
          },
        ],
        resolvedByUserId,
        resolvedAt: new Date(),
      },
    });
  });

  it('returns 401 without token', async () => {
    const response = await request(app.server).get(
      `/v1/admin/pos/conflicts/${pendingConflictId}`,
    );
    expect([400, 401, 403]).toContain(response.status);
    expect(response.status).not.toBe(200);
  });

  it('returns 403 when the user lacks sales.pos.admin', async () => {
    const response = await request(app.server)
      .get(`/v1/admin/pos/conflicts/${pendingConflictId}`)
      .set('Authorization', `Bearer ${unauthorizedToken}`);
    expect(response.status).toBe(403);
  });

  it('returns 404 when the conflict does not exist', async () => {
    const response = await request(app.server)
      .get('/v1/admin/pos/conflicts/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(response.status).toBe(404);
  });

  it('returns 200 with enriched single conflict (pending)', async () => {
    const response = await request(app.server)
      .get(`/v1/admin/pos/conflicts/${pendingConflictId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    const c = response.body.conflict;
    expect(c.id).toBe(pendingConflictId);
    expect(c.posTerminalId).toBe(terminalId);
    expect(c.terminalName).toMatch(/^Get Conflict E2E/);
    expect(c.posOperatorEmployeeId).toBe(operatorEmployeeId);
    expect(c.operatorName).toBeTypeOf('string');
    expect(c.operatorName.length).toBeGreaterThan(0);
    expect(c.conflictDetails).toHaveLength(1);
    expect(c.conflictDetails[0].variantId).toBe(variantId);
    expect(c.conflictDetails[0].variantName).toBe(variantName);
    expect(c.resolvedByUserId).toBeNull();
    expect(c.resolvedByUserName).toBe('');
    expect(c.order).toBeNull();
  });

  it('returns 200 with resolvedByUserName for a resolved conflict', async () => {
    const response = await request(app.server)
      .get(`/v1/admin/pos/conflicts/${resolvedConflictId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    const c = response.body.conflict;
    expect(c.id).toBe(resolvedConflictId);
    expect(c.resolvedByUserId).toBe(resolvedByUserId);
    expect(c.resolvedByUserName).toBeTypeOf('string');
    expect(c.resolvedByUserName.length).toBeGreaterThan(0);
    expect(c.resolvedAt).not.toBeNull();
  });

  it('returns 404 when conflict belongs to another tenant', async () => {
    const { tenantId: otherTenantId } = await createAndSetupTenant();
    const otherConflictId = randomUUID();
    await prisma.posOrderConflict.create({
      data: {
        id: otherConflictId,
        tenantId: otherTenantId,
        saleLocalUuid: randomUUID(),
        posTerminalId: terminalId,
        posSessionId: null,
        posOperatorEmployeeId: null,
        status: 'PENDING_RESOLUTION',
        conflictDetails: [],
      },
    });

    const response = await request(app.server)
      .get(`/v1/admin/pos/conflicts/${otherConflictId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(response.status).toBe(404);
  });
});
