import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createBenefitPlanE2E } from '@/utils/tests/factories/hr/create-benefit-plan.e2e';

describe('Get Benefit Plan (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should get a benefit plan by id', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const { benefitPlanId } = await createBenefitPlanE2E({
      tenantId,
      type: 'HEALTH',
      name: 'Plano de Saúde E2E',
    });

    const response = await request(app.server)
      .get(`/v1/hr/benefit-plans/${benefitPlanId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('benefitPlan');
    expect(response.body.benefitPlan.id).toBe(benefitPlanId);
    expect(response.body.benefitPlan.name).toBe('Plano de Saúde E2E');
    expect(response.body.benefitPlan.type).toBe('HEALTH');
  });

  it('should return 404 for non-existent benefit plan', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .get('/v1/hr/benefit-plans/non-existent-id')
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(404);
  });

  it('should reject unauthenticated request', async () => {
    const { benefitPlanId } = await createBenefitPlanE2E({
      tenantId,
      type: 'VR',
    });

    const response = await request(app.server).get(
      `/v1/hr/benefit-plans/${benefitPlanId}`,
    );

    expect(response.statusCode).toBe(401);
  });
});
