import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Update Workflow (E2E)', () => {
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

  afterAll(async () => {
    await app.close();
  });

  it('should update workflow (toggle isActive) (200)', async () => {
    const workflow = await prisma.aiWorkflow.create({
      data: {
        tenantId,
        userId,
        name: 'Workflow para UPDATE E2E',
        description: 'Workflow criado para teste E2E de update',
        naturalPrompt: 'Enviar alerta quando estoque baixo',
        triggerType: 'MANUAL',
        actions: [{ tool: 'stock.check-low-stock', args: { threshold: 10 } }],
        isActive: true,
      },
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

  it('should update workflow name and description', async () => {
    const workflow = await prisma.aiWorkflow.create({
      data: {
        tenantId,
        userId,
        name: 'Nome Original E2E',
        description: 'Descricao original',
        naturalPrompt: 'Enviar alerta',
        triggerType: 'MANUAL',
        actions: [{ tool: 'stock.check-low-stock', args: { threshold: 5 } }],
        isActive: true,
      },
    });

    const response = await request(app.server)
      .patch(`/v1/ai/workflows/${workflow.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Nome Atualizado E2E',
        description: 'Descricao atualizada',
      });

    expect(response.status).toBe(200);
    expect(response.body.name).toBe('Nome Atualizado E2E');
    expect(response.body.description).toBe('Descricao atualizada');
  });

  it('should return 401 without token', async () => {
    const fakeId = '00000000-0000-0000-0000-000000000000';

    const response = await request(app.server)
      .patch(`/v1/ai/workflows/${fakeId}`)
      .send({ isActive: false });

    expect(response.status).toBe(401);
  });
});
