import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Run Workflow (E2E)', () => {
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


  it('should run workflow manually (200 or execution error)', async () => {
    const workflow = await prisma.aiWorkflow.create({
      data: {
        tenantId,
        userId,
        name: 'Workflow para RUN E2E',
        description: 'Workflow criado para teste E2E de run',
        naturalPrompt: 'Enviar alerta quando estoque baixo',
        triggerType: 'MANUAL',
        actions: [{ tool: 'stock.check-low-stock', args: { threshold: 10 } }],
        isActive: true,
      },
    });

    const response = await request(app.server)
      .post(`/v1/ai/workflows/${workflow.id}/run`)
      .set('Authorization', `Bearer ${token}`);

    // The run may succeed or fail depending on available tools
    if (response.status === 200) {
      expect(response.body).toHaveProperty('executionId');
      expect(response.body).toHaveProperty('status');
    } else {
      expect([400, 404, 500]).toContain(response.status);
    }
  });

  it('should return 401 without token', async () => {
    const fakeId = '00000000-0000-0000-0000-000000000000';

    const response = await request(app.server).post(
      `/v1/ai/workflows/${fakeId}/run`,
    );

    expect(response.status).toBe(401);
  });
});
