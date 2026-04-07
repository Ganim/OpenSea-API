import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createCalendarEvent } from '@/utils/tests/factories/calendar/create-calendar-test-data.e2e';

describe('Share Event With Team (E2E)', () => {
  let tenantId: string;
  let ownerToken: string;
  let ownerId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;

    const owner = await createAndAuthenticateUser(app, { tenantId });
    ownerToken = owner.token;
    ownerId = owner.user.user.id;
  });

  it('should share an event with a team', async () => {
    const event = await createCalendarEvent(tenantId, ownerId);

    // Create a team with the owner as member
    const team = await prisma.team.create({
      data: {
        tenantId,
        name: `Equipe Share ${Date.now()}`,
        slug: `equipe-share-${Date.now()}`,
        createdBy: ownerId,
        settings: {},
      },
    });

    await prisma.teamMember.create({
      data: {
        tenantId,
        teamId: team.id,
        userId: ownerId,
        role: 'OWNER',
      },
    });

    const response = await request(app.server)
      .post(`/v1/calendar/events/${event.id}/share-team`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ teamId: team.id });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('shared');
    expect(typeof response.body.shared).toBe('number');
  });

  it('should return 404 for non-existent event', async () => {
    const fakeEventId = randomUUID();

    const team = await prisma.team.create({
      data: {
        tenantId,
        name: `Equipe Fake ${Date.now()}`,
        slug: `equipe-fake-${Date.now()}`,
        createdBy: ownerId,
        settings: {},
      },
    });

    const response = await request(app.server)
      .post(`/v1/calendar/events/${fakeEventId}/share-team`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ teamId: team.id });

    expect(response.status).toBe(404);
  });

  it('should return 401 without token', async () => {
    const fakeEventId = randomUUID();

    const response = await request(app.server)
      .post(`/v1/calendar/events/${fakeEventId}/share-team`)
      .send({ teamId: randomUUID() });

    expect(response.status).toBe(401);
  });
});
