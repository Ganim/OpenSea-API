import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('List Executions (E2E)', () => {
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

  it('should list workflow executions (200)', async () => {
    const workflow = await prisma.aiWorkflow.create({
      data: {
        tenantId,
        userId,
        name: 'Workflow para LIST EXECUTIONS E2E',
        description: 'Workflow criado para teste E2E de list executions',
        naturalPrompt: 'Enviar alerta quando estoque baixo',
        triggerType: 'MANUAL',
        actions: [{ tool: 'stock.check-low-stock', args: { threshold: 10 } }],
        isActive: true,
      },
    });

    // Create an execution directly via Prisma
    await prisma.aiWorkflowExecution.create({
      data: {
        workflowId: workflow.id,
        status: 'COMPLETED',
        trigger: 'MANUAL',
        results: { success: true },
        startedAt: new Date(),
        completedAt: new Date(),
      },
    });

    const response = await request(app.server)
      .get(`/v1/ai/workflows/${workflow.id}/executions`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('data');
    expect(response.body).toHaveProperty('meta');
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.data.length).toBeGreaterThanOrEqual(1);
    expect(response.body.data[0]).toHaveProperty('id');
    expect(response.body.data[0]).toHaveProperty('status');
    expect(response.body.data[0]).toHaveProperty('trigger');
  });

  it('should return 401 without token', async () => {
    const fakeId = '00000000-0000-0000-0000-000000000000';

    const response = await request(app.server).get(
      `/v1/ai/workflows/${fakeId}/executions`,
    );

    expect(response.status).toBe(401);
  });
});
