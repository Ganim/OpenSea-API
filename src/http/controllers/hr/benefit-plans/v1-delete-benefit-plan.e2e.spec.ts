import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createBenefitPlanE2E } from '@/utils/tests/factories/hr/create-benefit-plan.e2e';

describe('Delete Benefit Plan (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  it('should delete (deactivate) a benefit plan', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const { benefitPlanId } = await createBenefitPlanE2E({
      tenantId,
      type: 'HEALTH',
    });

    const response = await request(app.server)
      .delete(`/v1/hr/benefit-plans/${benefitPlanId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(204);
  });

  it('should return 404 for non-existent benefit plan', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .delete('/v1/hr/benefit-plans/non-existent-id')
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(404);
  });

  it('should reject unauthenticated request', async () => {
    const { benefitPlanId } = await createBenefitPlanE2E({
      tenantId,
      type: 'VR',
    });

    const response = await request(app.server).delete(
      `/v1/hr/benefit-plans/${benefitPlanId}`,
    );

    expect(response.statusCode).toBe(401);
  });
});
