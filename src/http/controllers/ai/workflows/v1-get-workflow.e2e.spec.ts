import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Get Workflow (E2E)', () => {
  let tenantId: string;
  let token: string;
  let userId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
    const auth = await createAndAuthenticateUser(app, { tenantId });
    token = auth.token;
    userId = auth.user.user.id;
  });

  it('should get workflow by ID (200)', async () => {
    const workflow = await prisma.aiWorkflow.create({
      data: {
        tenantId,
        userId,
        name: 'Workflow para GET E2E',
        description: 'Workflow criado para teste E2E de get',
        naturalPrompt: 'Enviar alerta quando estoque baixo',
        triggerType: 'MANUAL',
        actions: [{ tool: 'stock.check-low-stock', args: { threshold: 10 } }],
        isActive: true,
      },
    });

    const response = await request(app.server)
      .get(`/v1/ai/workflows/${workflow.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.id).toBe(workflow.id);
    expect(response.body.name).toBe('Workflow para GET E2E');
    expect(response.body).toHaveProperty('description');
    expect(response.body).toHaveProperty('triggerType');
    expect(response.body).toHaveProperty('actions');
    expect(response.body).toHaveProperty('isActive');
  });

  it('should return 404 for non-existent workflow', async () => {
    const fakeId = '00000000-0000-0000-0000-000000000000';

    const response = await request(app.server)
      .get(`/v1/ai/workflows/${fakeId}`)
      .set('Authorization', `Bearer ${token}`);

    expect([400, 404]).toContain(response.status);
  });

  it('should return 401 without token', async () => {
    const fakeId = '00000000-0000-0000-0000-000000000000';

    const response = await request(app.server).get(
      `/v1/ai/workflows/${fakeId}`,
    );

    expect(response.status).toBe(401);
  });
});
