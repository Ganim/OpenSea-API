import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { ZoneStructure } from '@/entities/stock/value-objects/zone-structure';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import type { Prisma } from '@prisma/generated/client.js';

describe('Unassign POS Terminal Zone (E2E)', () => {
  let tenantId: string;
  let token: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
    // Explicit POS permissions because the seeded `admin-test` group lacks
    // `sales.pos.*` codes (see Task 23 context). `sales.pos.admin` guards
    // both the endpoint under test and the PUT helper used here to assign
    // a zone before unassigning it.
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
        terminalName: `Unassign Zone Terminal ${Date.now()}`,
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

  async function assignZoneToTerminal(
    terminalId: string,
    zoneId: string,
  ): Promise<void> {
    const response = await request(app.server)
      .put(`/v1/pos/terminals/${terminalId}/zones/${zoneId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ tier: 'PRIMARY' });
    expect(response.status).toBe(200);
  }

  it('should return 401/400/403 without token', async () => {
    const response = await request(app.server)
      .delete(
        '/v1/pos/terminals/00000000-0000-0000-0000-000000000001/zones/00000000-0000-0000-0000-000000000002',
      )
      .send();

    expect([400, 401, 403]).toContain(response.status);
    expect(response.status).not.toBe(200);
  });

  it('should remove an existing terminal-zone link (200)', async () => {
    const terminalId = await createTerminal();
    const zoneId = await createZone();
    await assignZoneToTerminal(terminalId, zoneId);

    const response = await request(app.server)
      .delete(`/v1/pos/terminals/${terminalId}/zones/${zoneId}`)
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ success: true });

    const linksInDb = await prisma.posTerminalZone.findMany({
      where: { terminalId, zoneId },
    });
    expect(linksInDb).toHaveLength(0);
  });

  it('should return 404 when the link does not exist', async () => {
    const terminalId = await createTerminal();
    const zoneId = await createZone();

    const response = await request(app.server)
      .delete(`/v1/pos/terminals/${terminalId}/zones/${zoneId}`)
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('message');
  });

  it('should return 404 when deleting twice (idempotency check)', async () => {
    const terminalId = await createTerminal();
    const zoneId = await createZone();
    await assignZoneToTerminal(terminalId, zoneId);

    const firstDelete = await request(app.server)
      .delete(`/v1/pos/terminals/${terminalId}/zones/${zoneId}`)
      .set('Authorization', `Bearer ${token}`)
      .send();
    expect(firstDelete.status).toBe(200);

    const secondDelete = await request(app.server)
      .delete(`/v1/pos/terminals/${terminalId}/zones/${zoneId}`)
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(secondDelete.status).toBe(404);
  });
});
