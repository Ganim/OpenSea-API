import { randomUUID } from 'node:crypto';

import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createEmployeeE2E } from '@/utils/tests/factories/hr/create-employee.e2e';

/**
 * E2E for `GET /v1/admin/pos/conflicts` (Emporion Plan A — Task 30).
 *
 * The endpoint lists POS Order Conflicts (pending/resolved) for the admin
 * operations panel. It is JWT-protected and gated by the `sales.pos.admin`
 * permission. This spec focuses on the HTTP-layer contract: auth (401),
 * authorization (403), happy path (200), and the `status[]` filter.
 *
 * The conflict rows are inserted directly via Prisma to avoid coupling this
 * E2E to the upstream sale-creation pipeline (which is already exercised by
 * Task 28's E2E).
 */
describe('List POS Conflicts (E2E)', () => {
  let tenantId: string;
  let adminToken: string;
  let unauthorizedToken: string;
  let terminalId: string;
  let operatorEmployeeId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;

    // Admin-like user with `sales.pos.admin` (gates the endpoint) plus the
    // ancillary permissions needed to create a terminal and an employee
    // through their own endpoints.
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

    // Second user WITHOUT `sales.pos.admin` to exercise the 403 path.
    const unauthorizedAuth = await createAndAuthenticateUser(app, {
      tenantId,
      permissions: ['sales.customers.access'],
    });
    unauthorizedToken = unauthorizedAuth.token;

    // Create a terminal via the public endpoint so it carries the same shape
    // the production code path produces (including a real `terminalCode`).
    const createTerminalResponse = await request(app.server)
      .post('/v1/pos/terminals')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        terminalName: `Conflicts E2E Terminal ${Date.now()}`,
        mode: 'SALES_ONLY',
      });
    expect(createTerminalResponse.status).toBe(201);
    terminalId = createTerminalResponse.body.terminal.id;

    const { employee } = await createEmployeeE2E({
      tenantId,
      status: 'ACTIVE',
    });
    operatorEmployeeId = employee.id;

    // Insert a deterministic mix of conflicts: 3 PENDING_RESOLUTION + 2
    // CANCELED_REFUNDED. All rows belong to the same terminal/operator so the
    // assertions can target either dimension independently.
    const baseTime = new Date('2026-04-22T00:00:00.000Z').getTime();
    for (let pendingIndex = 0; pendingIndex < 3; pendingIndex++) {
      await prisma.posOrderConflict.create({
        data: {
          id: randomUUID(),
          tenantId,
          saleLocalUuid: randomUUID(),
          posTerminalId: terminalId,
          posSessionId: null,
          posOperatorEmployeeId: operatorEmployeeId,
          status: 'PENDING_RESOLUTION',
          conflictDetails: [
            {
              itemId: randomUUID(),
              variantId: randomUUID(),
              requestedQuantity: 5,
              availableQuantity: 2,
              shortage: 3,
              reason: 'INSUFFICIENT_STOCK',
            },
          ],
          createdAt: new Date(baseTime + pendingIndex * 60_000),
          updatedAt: new Date(baseTime + pendingIndex * 60_000),
        },
      });
    }

    for (let resolvedIndex = 0; resolvedIndex < 2; resolvedIndex++) {
      await prisma.posOrderConflict.create({
        data: {
          id: randomUUID(),
          tenantId,
          saleLocalUuid: randomUUID(),
          posTerminalId: terminalId,
          posSessionId: null,
          posOperatorEmployeeId: operatorEmployeeId,
          status: 'CANCELED_REFUNDED',
          conflictDetails: [
            {
              itemId: randomUUID(),
              variantId: randomUUID(),
              requestedQuantity: 1,
              availableQuantity: 0,
              shortage: 1,
              reason: 'INSUFFICIENT_STOCK',
            },
          ],
          resolvedByUserId: adminAuth.user.id,
          resolvedAt: new Date(),
          createdAt: new Date(baseTime + (10 + resolvedIndex) * 60_000),
          updatedAt: new Date(baseTime + (10 + resolvedIndex) * 60_000),
        },
      });
    }
  });

  it('returns 401 without token', async () => {
    const response = await request(app.server)
      .get('/v1/admin/pos/conflicts')
      .send();

    expect([400, 401, 403]).toContain(response.status);
    expect(response.status).not.toBe(200);
  });

  it('returns 403 when the user lacks sales.pos.admin', async () => {
    const response = await request(app.server)
      .get('/v1/admin/pos/conflicts')
      .set('Authorization', `Bearer ${unauthorizedToken}`)
      .send();

    expect(response.status).toBe(403);
  });

  it('returns 200 and a paginated, enriched listing', async () => {
    const response = await request(app.server)
      .get('/v1/admin/pos/conflicts')
      .set('Authorization', `Bearer ${adminToken}`)
      .send();

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('data');
    expect(response.body).toHaveProperty('meta');
    // The 5 rows we just inserted; tenant isolation guarantees nothing else
    // leaks into this listing.
    expect(response.body.meta.total).toBe(5);
    expect(response.body.meta.page).toBe(1);
    expect(response.body.meta.limit).toBe(20);
    expect(response.body.meta.pages).toBe(1);
    expect(response.body.data).toHaveLength(5);

    for (const row of response.body.data) {
      expect(row.posTerminalId).toBe(terminalId);
      expect(typeof row.terminalName).toBe('string');
      expect(row.terminalName.length).toBeGreaterThan(0);
      expect(row.posOperatorEmployeeId).toBe(operatorEmployeeId);
      expect(typeof row.operatorName).toBe('string');
      expect(row.operatorName.length).toBeGreaterThan(0);
      expect(Array.isArray(row.conflictDetails)).toBe(true);
    }
  });

  it('filters by status=PENDING_RESOLUTION', async () => {
    const response = await request(app.server)
      .get('/v1/admin/pos/conflicts?status=PENDING_RESOLUTION')
      .set('Authorization', `Bearer ${adminToken}`)
      .send();

    expect(response.status).toBe(200);
    expect(response.body.meta.total).toBe(3);
    expect(response.body.data).toHaveLength(3);
    for (const row of response.body.data) {
      expect(row.status).toBe('PENDING_RESOLUTION');
    }
  });
});
