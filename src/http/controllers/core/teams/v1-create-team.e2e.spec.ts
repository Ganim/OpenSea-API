import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Create Team (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  it('should create a team with minimal fields', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .post('/v1/teams')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Equipe Alpha' });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('team');
    expect(response.body.team.name).toBe('Equipe Alpha');
    expect(response.body.team.slug).toBe('equipe-alpha');
    expect(response.body.team.isActive).toBe(true);
    expect(response.body.team.membersCount).toBe(1);
  });

  it('should create a team with all fields', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .post('/v1/teams')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Equipe Beta',
        description: 'Equipe de desenvolvimento',
        color: '#3b82f6',
        avatarUrl: 'https://example.com/avatar.png',
      });

    expect(response.status).toBe(201);
    expect(response.body.team.name).toBe('Equipe Beta');
    expect(response.body.team.description).toBe('Equipe de desenvolvimento');
    expect(response.body.team.color).toBe('#3b82f6');
    expect(response.body.team.avatarUrl).toBe('https://example.com/avatar.png');
  });

  it('should reject empty name', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .post('/v1/teams')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: '' });

    expect(response.status).toBe(400);
  });

  it('should reject duplicate team name in same tenant', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    await request(app.server)
      .post('/v1/teams')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Equipe Duplicada' });

    const response = await request(app.server)
      .post('/v1/teams')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Equipe Duplicada' });

    expect(response.status).toBe(400);
    expect(response.body.message).toContain('already exists');
  });

  it('should return 401 without token', async () => {
    const response = await request(app.server)
      .post('/v1/teams')
      .send({ name: 'No Auth Team' });

    expect(response.status).toBe(401);
  });

  it('should return 403 without permission', async () => {
    const { token } = await createAndAuthenticateUser(app, {
      tenantId,
      permissions: [],
    });

    const response = await request(app.server)
      .post('/v1/teams')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'No Permission Team' });

    expect(response.status).toBe(403);
  });
});
