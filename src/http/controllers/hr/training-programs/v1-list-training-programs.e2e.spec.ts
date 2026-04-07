import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createTrainingProgramE2E } from '@/utils/tests/factories/hr/create-training-program.e2e';

describe('List Training Programs (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  it('should list training programs with correct schema', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    await createTrainingProgramE2E({ tenantId, category: 'SAFETY' });
    await createTrainingProgramE2E({ tenantId, category: 'TECHNICAL' });

    const response = await request(app.server)
      .get('/v1/hr/training-programs')
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('trainingPrograms');
    expect(response.body).toHaveProperty('total');
    expect(Array.isArray(response.body.trainingPrograms)).toBe(true);
    expect(response.body.total).toBeGreaterThanOrEqual(2);
  });

  it('should filter training programs by category', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    await createTrainingProgramE2E({ tenantId, category: 'LEADERSHIP' });

    const response = await request(app.server)
      .get('/v1/hr/training-programs?category=LEADERSHIP')
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(
      response.body.trainingPrograms.every(
        (program: { category: string }) => program.category === 'LEADERSHIP',
      ),
    ).toBe(true);
  });

  it('should reject unauthenticated request', async () => {
    const response = await request(app.server).get('/v1/hr/training-programs');

    expect(response.statusCode).toBe(401);
  });
});
