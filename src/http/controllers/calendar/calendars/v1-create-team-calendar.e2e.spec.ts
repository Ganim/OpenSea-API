import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Create Team Calendar (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });


  it('should create a team calendar', async () => {
    const { token, user } = await createAndAuthenticateUser(app, { tenantId });
    const userId = user.user.id;

    // Create a team and add the user as OWNER
    const team = await prisma.team.create({
      data: {
        tenantId,
        name: 'Equipe de Teste',
        slug: `equipe-teste-${Date.now()}`,
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

    const response = await request(app.server)
      .post('/v1/calendar/calendars/team')
      .set('Authorization', `Bearer ${token}`)
      .send({
        teamId: team.id,
        name: 'Calendário da Equipe',
        description: 'Calendário compartilhado da equipe de teste',
        color: '#3b82f6',
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('calendar');
    expect(response.body.calendar).toHaveProperty('id');
    expect(response.body.calendar.name).toBe('Calendário da Equipe');
    expect(response.body.calendar.type).toBe('TEAM');
    expect(response.body.calendar.color).toBe('#3b82f6');
  });

  it('should reject without team membership', async () => {
    const { token: _ownerToken, user: ownerUser } =
      await createAndAuthenticateUser(app, { tenantId });
    const { token: outsiderToken } = await createAndAuthenticateUser(app, {
      tenantId,
    });

    const ownerUserId = ownerUser.user.id;

    // Create a team with owner only
    const team = await prisma.team.create({
      data: {
        tenantId,
        name: 'Equipe Privada',
        slug: `equipe-privada-${Date.now()}`,
        createdBy: ownerUserId,
        settings: {},
      },
    });

    await prisma.teamMember.create({
      data: {
        tenantId,
        teamId: team.id,
        userId: ownerUserId,
        role: 'OWNER',
      },
    });

    // Outsider user tries to create a calendar for that team
    const response = await request(app.server)
      .post('/v1/calendar/calendars/team')
      .set('Authorization', `Bearer ${outsiderToken}`)
      .send({
        teamId: team.id,
        name: 'Calendário Não Autorizado',
      });

    expect(response.status).toBe(403);
    expect(response.body).toHaveProperty('message');
  });

  it('should require authentication', async () => {
    const response = await request(app.server)
      .post('/v1/calendar/calendars/team')
      .send({
        teamId: '00000000-0000-0000-0000-000000000000',
        name: 'Calendário Sem Auth',
      });

    expect(response.status).toBe(401);
  });
});
