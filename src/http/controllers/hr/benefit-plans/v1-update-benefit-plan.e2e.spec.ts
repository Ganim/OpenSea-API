import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createBenefitPlanE2E } from '@/utils/tests/factories/hr/create-benefit-plan.e2e';

describe('Update Benefit Plan (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });


  it('should update a benefit plan', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const { benefitPlanId } = await createBenefitPlanE2E({
      tenantId,
      type: 'HEALTH',
      name: 'Plano Original',
    });

    const response = await request(app.server)
      .put(`/v1/hr/benefit-plans/${benefitPlanId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Plano Atualizado',
        provider: 'Novo Provedor',
      });

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('benefitPlan');
    expect(response.body.benefitPlan.name).toBe('Plano Atualizado');
    expect(response.body.benefitPlan.provider).toBe('Novo Provedor');
  });

  it('should return 404 for non-existent benefit plan', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .put('/v1/hr/benefit-plans/non-existent-id')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Updated Name' });

    expect(response.statusCode).toBe(404);
  });

  it('should reject unauthenticated request', async () => {
    const { benefitPlanId } = await createBenefitPlanE2E({
      tenantId,
      type: 'VR',
    });

    const response = await request(app.server)
      .put(`/v1/hr/benefit-plans/${benefitPlanId}`)
      .send({ name: 'Updated' });

    expect(response.statusCode).toBe(401);
  });
});
