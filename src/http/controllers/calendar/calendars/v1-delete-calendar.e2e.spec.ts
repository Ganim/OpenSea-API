import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Delete Calendar (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should delete a team calendar', async () => {
    const { token, user } = await createAndAuthenticateUser(app, { tenantId });
    const userId = user.user.id;

    // Create a team and add user as OWNER
    const team = await prisma.team.create({
      data: {
        tenantId,
        name: `Equipe Delete ${Date.now()}`,
        slug: `equipe-delete-${Date.now()}`,
        createdBy: userId,
        settings: {},
      },
    });

    await prisma.teamMember.create({
      data: {
        tenantId,
        teamId: team.id,
        userId,
        role: 'OWNER',
      },
    });

    // Create a team calendar
    const calendar = await prisma.calendar.create({
      data: {
        tenantId,
        name: `Calendário para Deletar ${Date.now()}`,
        color: '#ef4444',
        type: 'TEAM',
        ownerId: team.id,
        isDefault: false,
        settings: {},
        createdBy: userId,
      },
    });

    const response = await request(app.server)
      .delete(`/v1/calendar/calendars/${calendar.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(204);

    // Verify soft-deleted
    const deleted = await prisma.calendar.findUnique({
      where: { id: calendar.id },
    });
    expect(deleted?.deletedAt).not.toBeNull();
  });

  it('should return 404 for non-existent calendar', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .delete('/v1/calendar/calendars/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(404);
  });

  it('should return 401 without token', async () => {
    const response = await request(app.server).delete(
      '/v1/calendar/calendars/00000000-0000-0000-0000-000000000000',
    );

    expect(response.status).toBe(401);
  });
});
