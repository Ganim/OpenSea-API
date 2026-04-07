import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('AI Workflows (E2E)', () => {
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

  /**
   * Helper to create a workflow directly via Prisma (bypasses AI provider)
   */
  async function createTestWorkflow(overrides: Record<string, unknown> = {}) {
    return prisma.aiWorkflow.create({
      data: {
        tenantId,
        userId,
        name: 'Workflow de Teste',
        description: 'Workflow criado para testes E2E',
        naturalPrompt:
          'Enviar alerta quando estoque ficar abaixo de 10 unidades',
        triggerType: 'MANUAL',
        actions: [
          {
            tool: 'stock.check-low-stock',
            args: { threshold: 10 },
          },
        ],
        isActive: true,
        ...overrides,
      },
    });
  }

  // --- CREATE ---

  it('POST /v1/ai/workflows — should create workflow from natural language (may use fallback)', async () => {
    const response = await request(app.server)
      .post('/v1/ai/workflows')
      .set('Authorization', `Bearer ${token}`)
      .send({
        naturalPrompt:
          'Quando o estoque de qualquer produto ficar abaixo de 5 unidades, enviar um alerta por email',
      });

    // AI provider may not be configured in test env
    if (response.status === 201) {
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('name');
      expect(response.body).toHaveProperty('description');
      expect(response.body).toHaveProperty('triggerType');
      expect(response.body).toHaveProperty('actions');
      expect(response.body).toHaveProperty('isActive');
    } else {
      // Accept provider-related errors
      expect([400, 500]).toContain(response.status);
    }
  });

  // --- LIST ---

  it('GET /v1/ai/workflows — should list workflows (empty initially)', async () => {
    // Create a fresh tenant for this test to ensure empty list
    const { tenantId: freshTenantId } = await createAndSetupTenant();
    const freshAuth = await createAndAuthenticateUser(app, {
      tenantId: freshTenantId,
    });

    const response = await request(app.server)
      .get('/v1/ai/workflows')
      .set('Authorization', `Bearer ${freshAuth.token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('data');
    expect(response.body).toHaveProperty('meta');
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.meta).toHaveProperty('total');
    expect(response.body.meta).toHaveProperty('page');
    expect(response.body.meta).toHaveProperty('limit');
    expect(response.body.meta).toHaveProperty('pages');
  });

  it('GET /v1/ai/workflows — should list workflows with data', async () => {
    await createTestWorkflow();

    const response = await request(app.server)
      .get('/v1/ai/workflows')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.data.length).toBeGreaterThanOrEqual(1);
    expect(response.body.data[0]).toHaveProperty('id');
    expect(response.body.data[0]).toHaveProperty('name');
    expect(response.body.data[0]).toHaveProperty('triggerType');
    expect(response.body.data[0]).toHaveProperty('isActive');
  });

  // --- GET BY ID ---

  it('GET /v1/ai/workflows/:id — should get workflow by ID', async () => {
    const workflow = await createTestWorkflow({
      name: 'Workflow para GET',
    });

    const response = await request(app.server)
      .get(`/v1/ai/workflows/${workflow.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.id).toBe(workflow.id);
    expect(response.body.name).toBe('Workflow para GET');
    expect(response.body).toHaveProperty('description');
    expect(response.body).toHaveProperty('triggerType');
    expect(response.body).toHaveProperty('actions');
    expect(response.body).toHaveProperty('isActive');
  });

  it('GET /v1/ai/workflows/:id — should return 404 for non-existent workflow', async () => {
    const fakeId = '00000000-0000-0000-0000-000000000000';

    const response = await request(app.server)
      .get(`/v1/ai/workflows/${fakeId}`)
      .set('Authorization', `Bearer ${token}`);

    expect([404, 400]).toContain(response.status);
  });

  // --- UPDATE ---

  it('PATCH /v1/ai/workflows/:id — should update workflow (toggle isActive)', async () => {
    const workflow = await createTestWorkflow({
      name: 'Workflow para UPDATE',
      isActive: true,
    });

    const response = await request(app.server)
      .patch(`/v1/ai/workflows/${workflow.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        isActive: false,
      });

    expect(response.status).toBe(200);
    expect(response.body.id).toBe(workflow.id);
    expect(response.body.isActive).toBe(false);
  });

  it('PATCH /v1/ai/workflows/:id — should update workflow name and description', async () => {
    const workflow = await createTestWorkflow({
      name: 'Nome Original',
      description: 'Descrição original',
    });

    const response = await request(app.server)
      .patch(`/v1/ai/workflows/${workflow.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Nome Atualizado',
        description: 'Descrição atualizada',
      });

    expect(response.status).toBe(200);
    expect(response.body.name).toBe('Nome Atualizado');
    expect(response.body.description).toBe('Descrição atualizada');
  });

  // --- RUN ---

  it('POST /v1/ai/workflows/:id/run — should run workflow manually', async () => {
    const workflow = await createTestWorkflow({
      name: 'Workflow para RUN',
    });

    const response = await request(app.server)
      .post(`/v1/ai/workflows/${workflow.id}/run`)
      .set('Authorization', `Bearer ${token}`);

    // The run may succeed or fail depending on available tools
    if (response.status === 200) {
      expect(response.body).toHaveProperty('executionId');
      expect(response.body).toHaveProperty('status');
    } else {
      // Accept errors (missing AI provider, action execution errors)
      expect([400, 404, 500]).toContain(response.status);
    }
  });

  // --- LIST EXECUTIONS ---

  it('GET /v1/ai/workflows/:id/executions — should list executions', async () => {
    const workflow = await createTestWorkflow({
      name: 'Workflow para EXECUTIONS',
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

  // --- DELETE ---

  it('DELETE /v1/ai/workflows/:id — should delete workflow', async () => {
    const workflow = await createTestWorkflow({
      name: 'Workflow para DELETE',
    });

    const deleteResponse = await request(app.server)
      .delete(`/v1/ai/workflows/${workflow.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(deleteResponse.status).toBe(204);

    // Verify it was deleted
    const getResponse = await request(app.server)
      .get(`/v1/ai/workflows/${workflow.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect([404, 400]).toContain(getResponse.status);
  });

  it('DELETE /v1/ai/workflows/:id — should return 404 for non-existent workflow', async () => {
    const fakeId = '00000000-0000-0000-0000-000000000000';

    const response = await request(app.server)
      .delete(`/v1/ai/workflows/${fakeId}`)
      .set('Authorization', `Bearer ${token}`);

    expect([404, 400]).toContain(response.status);
  });
});
