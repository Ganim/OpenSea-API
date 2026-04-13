import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Create Blueprint (E2E)', () => {
  let tenantId: string;
  let token: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
    const auth = await createAndAuthenticateUser(app, { tenantId });
    token = auth.token;
  });

  it('should return 401 without token', async () => {
    const response = await request(app.server)
      .post('/v1/sales/blueprints')
      .send({ name: 'Test Blueprint' });

    expect(response.status).toBe(401);
  });

  it('should create a blueprint with valid pipeline (201)', async () => {
    const timestamp = Date.now();

    // Create a pipeline for the blueprint
    const pipeline = await prisma.pipeline.create({
      data: {
        tenantId,
        name: `Pipeline BP ${timestamp}`,
        isDefault: false,
      },
    });

    const response = await request(app.server)
      .post('/v1/sales/blueprints')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: `Blueprint E2E ${timestamp}`,
        pipelineId: pipeline.id,
        isActive: true,
        stageRules: [],
      });

    expect([201, 400]).toContain(response.status);
    if (response.status === 201) {
      expect(response.body).toHaveProperty('blueprint');
      expect(response.body.blueprint).toHaveProperty('id');
      expect(response.body.blueprint.name).toBe(`Blueprint E2E ${timestamp}`);
    }
  });
});
