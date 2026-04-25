import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { ZoneStructure } from '@/entities/stock/value-objects/zone-structure';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import type { Prisma } from '@prisma/generated/client.js';

describe('Assign POS Terminal Zone (E2E)', () => {
  let tenantId: string;
  let token: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
    // Explicit POS permissions because the seeded `admin-test` group lacks
    // `sales.pos.*` codes (see Task 23 context). `sales.pos.admin` guards the
    // endpoint under test; `sales.pos.terminals.register` is required to
    // create the terminal under test via the POST controller. Zones and
    // warehouses are seeded directly via Prisma in this suite, so no extra
    // RBAC scope is needed beyond the POS pair.
    const auth = await createAndAuthenticateUser(app, {
      tenantId,
      permissions: ['sales.pos.admin', 'sales.pos.terminals.register'],
    });
    token = auth.token;
  });

  async function createTerminal(): Promise<string> {
    const response = await request(app.server)
      .post('/v1/pos/terminals')
      .set('Authorization', `Bearer ${token}`)
      .send({
        terminalName: `Assign Zone Terminal ${Date.now()}`,
        mode: 'SALES_ONLY',
      });
    expect(response.status).toBe(201);
    return response.body.terminal.id;
  }

  async function createZone(): Promise<string> {
    const timestamp = Date.now().toString();
    const warehouse = await prisma.warehouse.create({
      data: {
        tenantId,
        code: `W${timestamp.slice(-4)}`,
        name: `Warehouse ${timestamp}`,
      },
    });

    const zone = await prisma.zone.create({
      data: {
        tenantId,
        warehouseId: warehouse.id,
        code: `Z${timestamp.slice(-3)}`,
        name: `Zone ${timestamp}`,
        structure:
          ZoneStructure.empty().toJSON() as unknown as Prisma.InputJsonValue,
      },
    });
    return zone.id;
  }

  it('should return 401/400/403 without token', async () => {
    const response = await request(app.server)
      .put(
        '/v1/pos/terminals/00000000-0000-0000-0000-000000000001/zones/00000000-0000-0000-0000-000000000002',
      )
      .send({ tier: 'PRIMARY' });

    expect([400, 401, 403]).toContain(response.status);
    expect(response.status).not.toBe(200);
  });

  it('should create a PRIMARY link between terminal and zone (200)', async () => {
    const terminalId = await createTerminal();
    const zoneId = await createZone();

    const response = await request(app.server)
      .put(`/v1/pos/terminals/${terminalId}/zones/${zoneId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ tier: 'PRIMARY' });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('terminalZone');
    expect(response.body.terminalZone.terminalId).toBe(terminalId);
    expect(response.body.terminalZone.zoneId).toBe(zoneId);
    expect(response.body.terminalZone.tier).toBe('PRIMARY');
    expect(response.body.terminalZone.tenantId).toBe(tenantId);
  });

  it('should update tier when link already exists (idempotent)', async () => {
    const terminalId = await createTerminal();
    const zoneId = await createZone();

    const firstResponse = await request(app.server)
      .put(`/v1/pos/terminals/${terminalId}/zones/${zoneId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ tier: 'PRIMARY' });
    expect(firstResponse.status).toBe(200);
    const firstLinkId = firstResponse.body.terminalZone.id;

    const secondResponse = await request(app.server)
      .put(`/v1/pos/terminals/${terminalId}/zones/${zoneId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ tier: 'SECONDARY' });

    expect(secondResponse.status).toBe(200);
    expect(secondResponse.body.terminalZone.id).toBe(firstLinkId);
    expect(secondResponse.body.terminalZone.tier).toBe('SECONDARY');

    const linksInDb = await prisma.posTerminalZone.findMany({
      where: { terminalId, zoneId },
    });
    expect(linksInDb).toHaveLength(1);
    expect(linksInDb[0].tier).toBe('SECONDARY');
  });

  it('should return 404 when terminal does not exist', async () => {
    const zoneId = await createZone();
    const missingTerminalId = '00000000-0000-0000-0000-000000000000';

    const response = await request(app.server)
      .put(`/v1/pos/terminals/${missingTerminalId}/zones/${zoneId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ tier: 'PRIMARY' });

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('message');
  });

  it('should return 404 when zone does not exist', async () => {
    const terminalId = await createTerminal();
    const missingZoneId = '00000000-0000-0000-0000-000000000000';

    const response = await request(app.server)
      .put(`/v1/pos/terminals/${terminalId}/zones/${missingZoneId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ tier: 'PRIMARY' });

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('message');
  });
});
