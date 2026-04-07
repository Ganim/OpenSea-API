import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { generateTrainingProgramData } from '@/utils/tests/factories/hr/create-training-program.e2e';

describe('Create Training Program (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  it('should create a training program', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const programData = generateTrainingProgramData({
      category: 'SAFETY',
      format: 'PRESENCIAL',
    });

    const response = await request(app.server)
      .post('/v1/hr/training-programs')
      .set('Authorization', `Bearer ${token}`)
      .send(programData);

    expect(response.statusCode).toBe(201);
    expect(response.body.trainingProgram).toBeDefined();
    expect(response.body.trainingProgram.category).toBe('SAFETY');
    expect(response.body.trainingProgram.format).toBe('PRESENCIAL');
    expect(response.body.trainingProgram.isActive).toBe(true);
  });

  it('should reject invalid category', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .post('/v1/hr/training-programs')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Invalid Program',
        category: 'INVALID',
        format: 'ONLINE',
        durationHours: 8,
      });

    expect(response.statusCode).toBe(400);
  });

  it('should reject unauthenticated request', async () => {
    const response = await request(app.server)
      .post('/v1/hr/training-programs')
      .send(generateTrainingProgramData());

    expect(response.statusCode).toBe(401);
  });
});
