import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createProductionTestData } from '@/utils/tests/factories/production/create-production-test-data.e2e';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

describe('Create Job Card (E2E)', () => {
  let tenantId: string;
  let token: string;
  let userId: string;
  let productionOrderId: string;
  let operationRoutingId: string;
  let workstationId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
    const auth = await createAndAuthenticateUser(app, { tenantId });
    token = auth.token;
    userId = auth.user.user.id;

    const data = await createProductionTestData({ tenantId, userId });
    productionOrderId = data.productionOrder.id;
    operationRoutingId = data.operationRouting.id;
    workstationId = data.workstation.id;
  });

  it('should create a job card', async () => {
    const response = await request(app.server)
      .post('/v1/production/job-cards')
      .set('Authorization', `Bearer ${token}`)
      .send({
        productionOrderId,
        operationRoutingId,
        workstationId,
        quantityPlanned: 50,
        scheduledStart: new Date().toISOString(),
        scheduledEnd: new Date(Date.now() + 86400000).toISOString(),
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('jobCard');
    expect(response.body.jobCard).toHaveProperty('id');
    expect(response.body.jobCard.productionOrderId).toBe(productionOrderId);
    expect(response.body.jobCard.operationRoutingId).toBe(operationRoutingId);
    expect(response.body.jobCard.quantityPlanned).toBe(50);
    expect(response.body.jobCard.status).toBe('PENDING');
  });
});
