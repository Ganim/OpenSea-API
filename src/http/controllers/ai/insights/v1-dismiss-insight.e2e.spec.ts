import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Dismiss Insight (E2E)', () => {
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

  it('should dismiss an insight (200)', async () => {
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

  it('should return 401 without token', async () => {
    const fakeId = '00000000-0000-0000-0000-000000000000';

    const response = await request(app.server).patch(
      `/v1/ai/insights/${fakeId}/dismiss`,
    );

    expect(response.status).toBe(401);
  });
});
