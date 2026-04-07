import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { generateBenefitPlanData } from '@/utils/tests/factories/hr/create-benefit-plan.e2e';

describe('Create Benefit Plan (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  it('should create a benefit plan with correct schema', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const benefitPlanData = generateBenefitPlanData({ type: 'HEALTH' });

    const response = await request(app.server)
      .post('/v1/hr/benefit-plans')
      .set('Authorization', `Bearer ${token}`)
      .send(benefitPlanData);

    expect(response.statusCode).toBe(201);
    expect(response.body).toHaveProperty('benefitPlan');
    expect(response.body.benefitPlan).toHaveProperty('id');
    expect(response.body.benefitPlan.name).toBe(benefitPlanData.name);
    expect(response.body.benefitPlan.type).toBe('HEALTH');
    expect(response.body.benefitPlan.isActive).toBe(true);
  });

  it('should reject creation with invalid benefit type', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .post('/v1/hr/benefit-plans')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Invalid Plan',
        type: 'INVALID_TYPE',
      });

    expect(response.statusCode).toBe(400);
  });

  it('should reject unauthenticated request', async () => {
    const benefitPlanData = generateBenefitPlanData({ type: 'VR' });

    const response = await request(app.server)
      .post('/v1/hr/benefit-plans')
      .send(benefitPlanData);

    expect(response.statusCode).toBe(401);
  });
});
