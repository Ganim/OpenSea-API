import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Update Team Calendar Permissions (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  it('should update team calendar permissions', async () => {
    const { token, user } = await createAndAuthenticateUser(app, { tenantId });
    const userId = user.user.id;

    // Create a team and add user as OWNER
    const team = await prisma.team.create({
      data: {
        tenantId,
        name: `Equipe Perms ${Date.now()}`,
        slug: `equipe-perms-${Date.now()}`,
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
        name: `Calendário Permissões ${Date.now()}`,
        color: '#8b5cf6',
        type: 'TEAM',
        ownerId: team.id,
        isDefault: false,
        settings: {},
        createdBy: userId,
      },
    });

    const response = await request(app.server)
      .patch(`/v1/calendar/calendars/${calendar.id}/team-permissions`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        MEMBER: {
          canCreateEvents: true,
          canEditOwnEvents: true,
          canEditAllEvents: false,
        },
        ADMIN: {
          canCreateEvents: true,
          canEditOwnEvents: true,
          canEditAllEvents: true,
        },
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message');
  });

  it('should return 404 for non-existent calendar', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .patch(
        '/v1/calendar/calendars/00000000-0000-0000-0000-000000000000/team-permissions',
      )
      .set('Authorization', `Bearer ${token}`)
      .send({
        MEMBER: { canCreateEvents: true },
      });

    expect(response.status).toBe(404);
  });

  it('should return 401 without token', async () => {
    const response = await request(app.server)
      .patch(
        '/v1/calendar/calendars/00000000-0000-0000-0000-000000000000/team-permissions',
      )
      .send({
        MEMBER: { canCreateEvents: true },
      });

    expect(response.status).toBe(401);
  });
});
