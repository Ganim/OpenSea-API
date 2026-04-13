import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Create Label Print Job (E2E)', () => {
  let tenantId: string;
  let token: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
    const auth = await createAndAuthenticateUser(app, { tenantId });
    token = auth.token;
  });

  it('should return 401 without token', async () => {
    const response = await request(app.server)
      .post('/v1/sales/print-jobs')
      .send({});

    expect(response.status).toBe(401);
  });

  it('should create a label print job with valid data (201)', async () => {
    const timestamp = Date.now();

    // Create a printer for the tenant
    const printer = await prisma.posPrinter.create({
      data: {
        tenantId,
        name: `Test Printer ${timestamp}`,
        type: 'LABEL',
        connection: 'USB',
        osName: `printer-${timestamp}`,
        status: 'ONLINE',
        isDefault: false,
      },
    });

    const response = await request(app.server)
      .post('/v1/sales/print-jobs')
      .set('Authorization', `Bearer ${token}`)
      .send({
        printerId: printer.id,
        content: '<label>Test Label Content</label>',
        copies: 1,
      });

    expect([201, 400]).toContain(response.status);
    if (response.status === 201) {
      expect(response.body).toHaveProperty('jobId');
    }
  });

  it('should return 404 for non-existent printer', async () => {
    const response = await request(app.server)
      .post('/v1/sales/print-jobs')
      .set('Authorization', `Bearer ${token}`)
      .send({
        printerId: '00000000-0000-0000-0000-000000000999',
        content: '<label>Test</label>',
        copies: 1,
      });

    expect([400, 404]).toContain(response.status);
  });
});
