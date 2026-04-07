import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createTrainingProgramE2E } from '@/utils/tests/factories/hr/create-training-program.e2e';

describe('Delete Training Program (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  it('should soft delete a training program', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const { trainingProgramId } = await createTrainingProgramE2E({
      tenantId,
    });

    const response = await request(app.server)
      .delete(`/v1/hr/training-programs/${trainingProgramId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(204);

    // Verify it's no longer findable
    const getResponse = await request(app.server)
      .get(`/v1/hr/training-programs/${trainingProgramId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(getResponse.statusCode).toBe(404);
  });

  it('should return 404 for non-existent program', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .delete('/v1/hr/training-programs/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(404);
  });
});
