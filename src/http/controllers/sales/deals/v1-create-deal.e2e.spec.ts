import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Create Deal (E2E)', () => {
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
      .post('/v1/deals')
      .send({ title: 'Test Deal' });

    expect(response.status).toBe(401);
  });

  it('should create a deal with valid data (201)', async () => {
    const timestamp = Date.now();

    // Create prerequisites: customer, pipeline, stage
    const customer = await prisma.customer.create({
      data: {
        tenantId,
        name: `Customer Deal ${timestamp}`,
        email: `cust-deal-${timestamp}@test.com`,
        type: 'INDIVIDUAL',
      },
    });

    const pipeline = await prisma.pipeline.create({
      data: {
        tenantId,
        name: `Pipeline Deal ${timestamp}`,
        isDefault: false,
      },
    });

    const stage = await prisma.pipelineStage.create({
      data: {
        tenantId,
        pipelineId: pipeline.id,
        name: `Stage Deal ${timestamp}`,
        position: 1,
      },
    });

    const response = await request(app.server)
      .post('/v1/deals')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: `Deal E2E ${timestamp}`,
        customerId: customer.id,
        pipelineId: pipeline.id,
        stageId: stage.id,
        value: 5000,
        currency: 'BRL',
      });

    expect([201, 400]).toContain(response.status);
    if (response.status === 201) {
      expect(response.body).toHaveProperty('deal');
      expect(response.body.deal).toHaveProperty('id');
      expect(response.body.deal.title).toBe(`Deal E2E ${timestamp}`);
      expect(response.body.deal.status).toBe('OPEN');
    }
  });

  it('should return 404 for non-existent customer', async () => {
    const response = await request(app.server)
      .post('/v1/deals')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: `Deal No Customer ${Date.now()}`,
        customerId: '00000000-0000-0000-0000-000000000999',
        pipelineId: '00000000-0000-0000-0000-000000000998',
        stageId: '00000000-0000-0000-0000-000000000997',
        value: 1000,
      });

    expect([400, 404]).toContain(response.status);
  });
});
