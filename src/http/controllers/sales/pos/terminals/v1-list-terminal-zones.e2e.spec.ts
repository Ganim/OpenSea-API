import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { ZoneStructure } from '@/entities/stock/value-objects/zone-structure';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import type { Prisma } from '@prisma/generated/client.js';

function generateCode(): string {
  const charset = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += charset[Math.floor(Math.random() * charset.length)];
  }
  return result;
}

describe('List POS Terminal Zones (E2E)', () => {
  let tenantId: string;
  let token: string;
  let terminalId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
    const auth = await createAndAuthenticateUser(app, {
      tenantId,
      permissions: ['sales.pos.terminals.access', 'sales.pos.admin'],
    });
    token = auth.token;

    const terminal = await prisma.posTerminal.create({
      data: {
        tenantId,
        terminalName: 'Terminal List Zones',
        terminalCode: generateCode(),
        mode: 'SALES_ONLY',
        isActive: true,
        requiresSession: false,
        allowAnonymous: false,
      },
    });
    terminalId = terminal.id;
  });

  it('should return 401 without token', async () => {
    const response = await request(app.server).get(
      `/v1/pos/terminals/${terminalId}/zones`,
    );
    expect(response.status).toBe(401);
  });

  it('should return 200 with empty list when terminal has no zones', async () => {
    const response = await request(app.server)
      .get(`/v1/pos/terminals/${terminalId}/zones`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('zones');
    expect(Array.isArray(response.body.zones)).toBe(true);
    expect(response.body.zones.length).toBe(0);
  });

  it('should return 404 when terminal does not exist', async () => {
    const response = await request(app.server)
      .get('/v1/pos/terminals/00000000-0000-0000-0000-000000000000/zones')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(404);
  });

  it('should return enriched zones with warehouse name', async () => {
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
        allowsFractionalSale: true,
        structure:
          ZoneStructure.empty().toJSON() as unknown as Prisma.InputJsonValue,
      },
    });

    await request(app.server)
      .put(`/v1/pos/terminals/${terminalId}/zones/${zone.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ tier: 'PRIMARY' });

    const response = await request(app.server)
      .get(`/v1/pos/terminals/${terminalId}/zones`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.zones.length).toBeGreaterThan(0);

    const row = response.body.zones.find(
      (z: { zoneId: string }) => z.zoneId === zone.id,
    );
    expect(row).toBeDefined();
    expect(row.tier).toBe('PRIMARY');
    expect(row.zone.id).toBe(zone.id);
    expect(row.zone.code).toBe(`Z${timestamp.slice(-3)}`);
    expect(row.zone.name).toBe(`Zone ${timestamp}`);
    expect(row.zone.allowsFractionalSale).toBe(true);
    expect(row.zone.warehouseId).toBe(warehouse.id);
    expect(row.zone.warehouseName).toBe(`Warehouse ${timestamp}`);
  });
});
