import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createTeam } from '@/utils/tests/factories/core/create-team-test-data.e2e';
import { createEmailAccount } from '@/utils/tests/factories/core/create-email-account-test-data.e2e';

describe('Team Emails (E2E)', () => {
  let tenantId: string;
  let token: string;
  let ownerId: string;
  let noPermsToken: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant({
      name: 'Test Team Emails Tenant',
    });
    tenantId = tid;

    const auth = await createAndAuthenticateUser(app, { tenantId });
    token = auth.token;
    ownerId = auth.user.user.id;

    const noPerms = await createAndAuthenticateUser(app, {
      tenantId,
      permissions: [],
    });
    noPermsToken = noPerms.token;
  }, 180000);

  afterAll(async () => {
    await app.close();
  });

  // ─── POST /v1/teams/:teamId/emails ────────────────────────────────────────

  describe('Vincular email (POST /v1/teams/:teamId/emails)', () => {
    it('deve vincular conta de email ao time com permissões padrão', async () => {
      const team = await createTeam(tenantId, ownerId);
      const emailAccount = await createEmailAccount(tenantId, ownerId);

      const response = await request(app.server)
        .post(`/v1/teams/${team.id}/emails`)
        .set('Authorization', `Bearer ${token}`)
        .send({ accountId: emailAccount.id });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('teamEmail');
      expect(response.body.teamEmail.accountId).toBe(emailAccount.id);
      expect(response.body.teamEmail.teamId).toBe(team.id);
      expect(response.body.teamEmail.ownerCanRead).toBe(true);
      expect(response.body.teamEmail.ownerCanSend).toBe(true);
      expect(response.body.teamEmail.ownerCanManage).toBe(true);
      expect(response.body.teamEmail.adminCanRead).toBe(true);
      expect(response.body.teamEmail.memberCanRead).toBe(true);
      expect(response.body.teamEmail.memberCanSend).toBe(false);
    });

    it('deve vincular com permissões customizadas', async () => {
      const team = await createTeam(tenantId, ownerId);
      const emailAccount = await createEmailAccount(tenantId, ownerId);

      const response = await request(app.server)
        .post(`/v1/teams/${team.id}/emails`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          accountId: emailAccount.id,
          memberCanSend: true,
          adminCanManage: true,
        });

      expect(response.status).toBe(201);
      expect(response.body.teamEmail.memberCanSend).toBe(true);
      expect(response.body.teamEmail.adminCanManage).toBe(true);
    });

    it('deve rejeitar vinculação duplicada', async () => {
      const team = await createTeam(tenantId, ownerId);
      const emailAccount = await createEmailAccount(tenantId, ownerId);

      await request(app.server)
        .post(`/v1/teams/${team.id}/emails`)
        .set('Authorization', `Bearer ${token}`)
        .send({ accountId: emailAccount.id });

      const response = await request(app.server)
        .post(`/v1/teams/${team.id}/emails`)
        .set('Authorization', `Bearer ${token}`)
        .send({ accountId: emailAccount.id });

      expect(response.status).toBe(400);
    });

    it('deve retornar 404 para time inexistente', async () => {
      const emailAccount = await createEmailAccount(tenantId, ownerId);

      const response = await request(app.server)
        .post('/v1/teams/00000000-0000-0000-0000-000000000000/emails')
        .set('Authorization', `Bearer ${token}`)
        .send({ accountId: emailAccount.id });

      expect(response.status).toBe(404);
    });

    it('deve retornar 401 sem token', async () => {
      const response = await request(app.server)
        .post('/v1/teams/00000000-0000-0000-0000-000000000000/emails')
        .send({ accountId: '00000000-0000-0000-0000-000000000001' });

      expect(response.status).toBe(401);
    });

    it('deve retornar 403 sem permissão', async () => {
      const response = await request(app.server)
        .post('/v1/teams/00000000-0000-0000-0000-000000000000/emails')
        .set('Authorization', `Bearer ${noPermsToken}`)
        .send({ accountId: '00000000-0000-0000-0000-000000000001' });

      expect(response.status).toBe(403);
    });
  });

  // ─── GET /v1/teams/:teamId/emails ─────────────────────────────────────────

  describe('Listar emails (GET /v1/teams/:teamId/emails)', () => {
    it('deve listar emails vinculados ao time', async () => {
      const team = await createTeam(tenantId, ownerId);
      const email1 = await createEmailAccount(tenantId, ownerId);
      const email2 = await createEmailAccount(tenantId, ownerId);

      await request(app.server)
        .post(`/v1/teams/${team.id}/emails`)
        .set('Authorization', `Bearer ${token}`)
        .send({ accountId: email1.id });
      await request(app.server)
        .post(`/v1/teams/${team.id}/emails`)
        .set('Authorization', `Bearer ${token}`)
        .send({ accountId: email2.id });

      const response = await request(app.server)
        .get(`/v1/teams/${team.id}/emails`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('emailAccounts');
      expect(response.body.emailAccounts).toHaveLength(2);
      expect(response.body.emailAccounts[0]).toHaveProperty('accountId');
      expect(response.body.emailAccounts[0]).toHaveProperty('accountAddress');
    });

    it('deve retornar lista vazia para time sem emails', async () => {
      const team = await createTeam(tenantId, ownerId);

      const response = await request(app.server)
        .get(`/v1/teams/${team.id}/emails`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.emailAccounts).toHaveLength(0);
    });

    it('deve retornar 404 para time inexistente', async () => {
      const response = await request(app.server)
        .get('/v1/teams/00000000-0000-0000-0000-000000000000/emails')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
    });
  });

  // ─── PATCH /v1/teams/:teamId/emails/:accountId ────────────────────────────

  describe('Atualizar permissões (PATCH /v1/teams/:teamId/emails/:accountId)', () => {
    it('deve atualizar permissões de email', async () => {
      const team = await createTeam(tenantId, ownerId);
      const emailAccount = await createEmailAccount(tenantId, ownerId);

      await request(app.server)
        .post(`/v1/teams/${team.id}/emails`)
        .set('Authorization', `Bearer ${token}`)
        .send({ accountId: emailAccount.id });

      const response = await request(app.server)
        .patch(`/v1/teams/${team.id}/emails/${emailAccount.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          memberCanSend: true,
          memberCanManage: true,
          adminCanManage: true,
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('teamEmail');
      expect(response.body.teamEmail.memberCanSend).toBe(true);
      expect(response.body.teamEmail.memberCanManage).toBe(true);
      expect(response.body.teamEmail.adminCanManage).toBe(true);
      expect(response.body.teamEmail.ownerCanRead).toBe(true);
    });

    it('deve retornar 404 para email não vinculado', async () => {
      const team = await createTeam(tenantId, ownerId);

      const response = await request(app.server)
        .patch(
          `/v1/teams/${team.id}/emails/00000000-0000-0000-0000-000000000000`,
        )
        .set('Authorization', `Bearer ${token}`)
        .send({ memberCanSend: true });

      expect(response.status).toBe(404);
    });
  });

  // ─── DELETE /v1/teams/:teamId/emails/:accountId ───────────────────────────

  describe('Desvincular email (DELETE /v1/teams/:teamId/emails/:accountId)', () => {
    it('deve desvincular email do time', async () => {
      const team = await createTeam(tenantId, ownerId);
      const emailAccount = await createEmailAccount(tenantId, ownerId);

      await request(app.server)
        .post(`/v1/teams/${team.id}/emails`)
        .set('Authorization', `Bearer ${token}`)
        .send({ accountId: emailAccount.id });

      const response = await request(app.server)
        .delete(`/v1/teams/${team.id}/emails/${emailAccount.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(204);

      // Verify it was removed
      const listResponse = await request(app.server)
        .get(`/v1/teams/${team.id}/emails`)
        .set('Authorization', `Bearer ${token}`);

      expect(listResponse.body.emailAccounts).toHaveLength(0);
    });

    it('deve retornar 404 para email não vinculado', async () => {
      const team = await createTeam(tenantId, ownerId);

      const response = await request(app.server)
        .delete(
          `/v1/teams/${team.id}/emails/00000000-0000-0000-0000-000000000000`,
        )
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
    });

    it('deve retornar 401 sem token', async () => {
      const response = await request(app.server).delete(
        '/v1/teams/00000000-0000-0000-0000-000000000000/emails/00000000-0000-0000-0000-000000000001',
      );

      expect(response.status).toBe(401);
    });
  });
});
