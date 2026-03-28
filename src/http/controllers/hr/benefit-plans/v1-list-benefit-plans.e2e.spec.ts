import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createBenefitPlanE2E } from '@/utils/tests/factories/hr/create-benefit-plan.e2e';

describe('List Benefit Plans (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should list benefit plans with correct schema', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    await createBenefitPlanE2E({ tenantId, type: 'HEALTH' });
    await createBenefitPlanE2E({ tenantId, type: 'VR' });

    const response = await request(app.server)
      .get('/v1/hr/benefit-plans')
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('benefitPlans');
    expect(response.body).toHaveProperty('total');
    expect(Array.isArray(response.body.benefitPlans)).toBe(true);
    expect(response.body.total).toBeGreaterThanOrEqual(2);
  });

  it('should filter benefit plans by type', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    await createBenefitPlanE2E({ tenantId, type: 'DENTAL' });

    const response = await request(app.server)
      .get('/v1/hr/benefit-plans?type=DENTAL')
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(
      response.body.benefitPlans.every(
        (plan: { type: string }) => plan.type === 'DENTAL',
      ),
    ).toBe(true);
  });

  it('should reject unauthenticated request', async () => {
    const response = await request(app.server).get('/v1/hr/benefit-plans');

    expect(response.statusCode).toBe(401);
  });
});
