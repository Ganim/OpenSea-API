import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Update Calendar (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should update a team calendar', async () => {
    const { token, user } = await createAndAuthenticateUser(app, { tenantId });
    const userId = user.user.id;

    // Create a team and add user as OWNER
    const team = await prisma.team.create({
      data: {
        tenantId,
        name: `Equipe Update ${Date.now()}`,
        slug: `equipe-update-${Date.now()}`,
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
        name: `Calendário Original ${Date.now()}`,
        color: '#3b82f6',
        type: 'TEAM',
        ownerId: team.id,
        isDefault: false,
        settings: {},
        createdBy: userId,
      },
    });

    const response = await request(app.server)
      .patch(`/v1/calendar/calendars/${calendar.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Calendário Atualizado',
        color: '#10b981',
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('calendar');
    expect(response.body.calendar.name).toBe('Calendário Atualizado');
    expect(response.body.calendar.color).toBe('#10b981');
  });

  it('should return 404 for non-existent calendar', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .patch('/v1/calendar/calendars/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Novo Nome' });

    expect(response.status).toBe(404);
  });

  it('should return 401 without token', async () => {
    const response = await request(app.server)
      .patch('/v1/calendar/calendars/00000000-0000-0000-0000-000000000000')
      .send({ name: 'Novo Nome' });

    expect(response.status).toBe(401);
  });
});
