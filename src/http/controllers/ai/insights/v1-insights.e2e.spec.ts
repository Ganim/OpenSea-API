import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('AI Insights (E2E)', () => {
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


  it('GET /v1/ai/insights — should list insights (empty initially)', async () => {
    const response = await request(app.server)
      .get('/v1/ai/insights')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('insights');
    expect(response.body).toHaveProperty('meta');
    expect(Array.isArray(response.body.insights)).toBe(true);
    expect(response.body.meta).toHaveProperty('total');
    expect(response.body.meta).toHaveProperty('page');
    expect(response.body.meta).toHaveProperty('limit');
    expect(response.body.meta).toHaveProperty('pages');
  });

  it('POST /v1/ai/insights/generate — should trigger insight generation', async () => {
    const response = await request(app.server)
      .post('/v1/ai/insights/generate')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('result');
    expect(response.body.result).toHaveProperty('generated');
    expect(response.body.result).toHaveProperty('skippedDuplicates');
    expect(response.body.result).toHaveProperty('errors');
    expect(typeof response.body.result.generated).toBe('number');
    expect(typeof response.body.result.skippedDuplicates).toBe('number');
    expect(Array.isArray(response.body.result.errors)).toBe(true);
  });

  it('PATCH /v1/ai/insights/:id/view — should mark insight as viewed', async () => {
    // Create an insight directly in the database
    const insight = await prisma.aiInsight.create({
      data: {
        tenantId,
        type: 'TREND',
        priority: 'MEDIUM',
        title: 'Insight de teste para view',
        content:
          'Este insight foi criado para testar a marcação como visualizado.',
        module: 'stock',
        status: 'NEW',
        targetUserIds: [userId],
      },
    });

    const response = await request(app.server)
      .patch(`/v1/ai/insights/${insight.id}/view`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('success');
    expect(response.body.success).toBe(true);
  });

  it('PATCH /v1/ai/insights/:id/dismiss — should dismiss an insight', async () => {
    // Create an insight directly in the database
    const insight = await prisma.aiInsight.create({
      data: {
        tenantId,
        type: 'ANOMALY',
        priority: 'HIGH',
        title: 'Insight de teste para dismiss',
        content: 'Este insight foi criado para testar o descarte.',
        module: 'finance',
        status: 'NEW',
        targetUserIds: [userId],
      },
    });

    const response = await request(app.server)
      .patch(`/v1/ai/insights/${insight.id}/dismiss`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('success');
    expect(response.body.success).toBe(true);
  });

  it('GET /v1/ai/insights — should filter by status', async () => {
    const response = await request(app.server)
      .get('/v1/ai/insights')
      .query({ status: 'DISMISSED' })
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('insights');
    for (const insight of response.body.insights) {
      expect(insight.status).toBe('DISMISSED');
    }
  });
});
