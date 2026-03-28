import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createTrainingProgramE2E } from '@/utils/tests/factories/hr/create-training-program.e2e';

describe('Update Training Program (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should update a training program', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const { trainingProgramId } = await createTrainingProgramE2E({
      tenantId,
      name: 'Original Name',
    });

    const response = await request(app.server)
      .put(`/v1/hr/training-programs/${trainingProgramId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Updated Name', durationHours: 24 });

    expect(response.statusCode).toBe(200);
    expect(response.body.trainingProgram.name).toBe('Updated Name');
    expect(response.body.trainingProgram.durationHours).toBe(24);
  });

  it('should return 404 for non-existent program', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .put('/v1/hr/training-programs/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Does not exist' });

    expect(response.statusCode).toBe(404);
  });
});
