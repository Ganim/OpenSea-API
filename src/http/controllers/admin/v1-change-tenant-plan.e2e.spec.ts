import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateSuperAdmin } from '@/utils/tests/factories/core/create-and-authenticate-super-admin.e2e';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

describe('Change Tenant Plan (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should change a tenant plan', async () => {
    const { token } = await createAndAuthenticateSuperAdmin(app);

    // Create a tenant
    const tenant = await prisma.tenant.create({
      data: {
        name: `Plan Change Tenant ${Date.now()}`,
        slug: `plan-change-${Date.now()}`,
        status: 'ACTIVE',
      },
    });

    // Create an initial plan and assign it to the tenant
    const initialPlanResponse = await request(app.server)
      .post('/v1/admin/plans')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: `Initial Plan ${Date.now()}` });

    const initialPlanId = initialPlanResponse.body.plan.id;

    await prisma.tenantPlan.create({
      data: {
        tenantId: tenant.id,
        planId: initialPlanId,
        startsAt: new Date(),
      },
    });

    // Create the target plan
    const targetPlanResponse = await request(app.server)
      .post('/v1/admin/plans')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: `Target Plan ${Date.now()}` });

    const targetPlanId = targetPlanResponse.body.plan.id;

    // Change tenant plan
    const response = await request(app.server)
      .put(`/v1/admin/tenants/${tenant.id}/plan`)
      .set('Authorization', `Bearer ${token}`)
      .send({ planId: targetPlanId });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('tenantPlan');
    expect(response.body.tenantPlan).toHaveProperty('id');
    expect(response.body.tenantPlan.tenantId).toBe(tenant.id);
    expect(response.body.tenantPlan.planId).toBe(targetPlanId);
  });

  it('should return 404 for non-existent tenant', async () => {
    const { token } = await createAndAuthenticateSuperAdmin(app);

    const planResponse = await request(app.server)
      .post('/v1/admin/plans')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: `Orphan Plan ${Date.now()}` });

    const planId = planResponse.body.plan.id;

    const response = await request(app.server)
      .put('/v1/admin/tenants/00000000-0000-0000-0000-000000000000/plan')
      .set('Authorization', `Bearer ${token}`)
      .send({ planId });

    expect(response.status).toBe(404);
  });

  it('should return 403 for non-super-admin user', async () => {
    const { token } = await createAndAuthenticateUser(app);

    const response = await request(app.server)
      .put('/v1/admin/tenants/00000000-0000-0000-0000-000000000000/plan')
      .set('Authorization', `Bearer ${token}`)
      .send({ planId: '00000000-0000-0000-0000-000000000000' });

    expect(response.status).toBe(403);
  });
});
