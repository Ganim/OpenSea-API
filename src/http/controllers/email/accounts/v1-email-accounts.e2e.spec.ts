import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

function makeAccountPayload(overrides: Record<string, unknown> = {}) {
  return {
    address: `account-${Date.now()}@example.com`,
    imapHost: 'imap.gmail.com',
    imapPort: 993,
    smtpHost: 'smtp.gmail.com',
    smtpPort: 587,
    username: `account-${Date.now()}@example.com`,
    secret: 'app-password',
    ...overrides,
  };
}

describe('Email Accounts Controller (E2E)', () => {
  let tenantId: string;
  let token: string;
  let tokenNoPerms: string;
  let secondUserId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant({ name: 'Test Email Accounts Tenant' });

    tenantId = tid;

    const authResult = await createAndAuthenticateUser(app, {
      tenantId,
      permissions: [
        'email.accounts.create', 'email.accounts.read', 'email.accounts.update',
        'email.accounts.delete', 'email.accounts.list', 'email.accounts.share',
        'email.sync.execute',
      ],
    });
    token = authResult.token;

    const noPermsResult = await createAndAuthenticateUser(app, { tenantId, permissions: [] });
    tokenNoPerms = noPermsResult.token;

    const secondUserResult = await createAndAuthenticateUser(app, { tenantId, permissions: ['email.accounts.read'] });
    secondUserId = secondUserResult.user.user.id;
  }, 30000);

  afterAll(async () => { await app.close(); });

  // ─── POST /v1/email/accounts ─────────────────────────────────────────────
  describe('Criar conta (POST /v1/email/accounts)', () => {
    it('[SUCESSO] deve criar conta com campos obrigatórios', async () => {
      const response = await request(app.server)
        .post('/v1/email/accounts')
        .set('Authorization', `Bearer ${token}`)
        .send(makeAccountPayload({ displayName: 'Conta Principal' }));
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('account');
      expect(response.body.account).toMatchObject({ displayName: 'Conta Principal', isActive: true });
      expect(response.body.account).toHaveProperty('id');
    });

    it('[SUCESSO] deve criar conta como padrão (isDefault=true)', async () => {
      const response = await request(app.server)
        .post('/v1/email/accounts')
        .set('Authorization', `Bearer ${token}`)
        .send(makeAccountPayload({ isDefault: true }));
      expect(response.status).toBe(201);
      expect(response.body.account.isDefault).toBe(true);
    });

    it('[FALHA] deve retornar 400 quando imapHost está ausente', async () => {
      const payload = makeAccountPayload() as Record<string, unknown>;
      delete payload.imapHost;
      const response = await request(app.server)
        .post('/v1/email/accounts')
        .set('Authorization', `Bearer ${token}`)
        .send(payload);
      expect(response.status).toBe(400);
    });

    it('[FALHA] deve retornar 400 quando secret está ausente', async () => {
      const payload = makeAccountPayload() as Record<string, unknown>;
      delete payload.secret;
      const response = await request(app.server)
        .post('/v1/email/accounts')
        .set('Authorization', `Bearer ${token}`)
        .send(payload);
      expect(response.status).toBe(400);
    });

    it('[FALHA] deve retornar 400 quando endereço de email é inválido', async () => {
      const response = await request(app.server)
        .post('/v1/email/accounts')
        .set('Authorization', `Bearer ${token}`)
        .send(makeAccountPayload({ address: 'nao-e-um-email' }));
      expect(response.status).toBe(400);
    });

    it('[FALHA] deve retornar 400 quando a porta IMAP é negativa', async () => {
      const response = await request(app.server)
        .post('/v1/email/accounts')
        .set('Authorization', `Bearer ${token}`)
        .send(makeAccountPayload({ imapPort: -1 }));
      expect(response.status).toBe(400);
    });

    it('[FALHA] deve retornar 401 sem autenticação', async () => {
      const response = await request(app.server)
        .post('/v1/email/accounts')
        .send(makeAccountPayload());
      expect(response.status).toBe(401);
    });

    it('[FALHA] deve retornar 403 sem permissão', async () => {
      const response = await request(app.server)
        .post('/v1/email/accounts')
        .set('Authorization', `Bearer ${tokenNoPerms}`)
        .send(makeAccountPayload());
      expect(response.status).toBe(403);
    });
  });

  // ─── GET /v1/email/accounts ──────────────────────────────────────────────
  describe('Listar contas (GET /v1/email/accounts)', () => {
    it('[SUCESSO] deve listar contas do tenant', async () => {
      await request(app.server)
        .post('/v1/email/accounts')
        .set('Authorization', `Bearer ${token}`)
        .send(makeAccountPayload());
      const response = await request(app.server)
        .get('/v1/email/accounts')
        .set('Authorization', `Bearer ${token}`);
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('[FALHA] deve retornar 401 sem autenticação', async () => {
      const response = await request(app.server).get('/v1/email/accounts');
      expect(response.status).toBe(401);
    });

    it('[FALHA] deve retornar 403 sem permissão', async () => {
      const response = await request(app.server)
        .get('/v1/email/accounts')
        .set('Authorization', `Bearer ${tokenNoPerms}`);
      expect(response.status).toBe(403);
    });
  });

  // ─── GET /v1/email/accounts/:id ─────────────────────────────────────────
  describe('Buscar conta por ID (GET /v1/email/accounts/:id)', () => {
    it('[SUCESSO] deve retornar a conta pelo ID', async () => {
      const createRes = await request(app.server)
        .post('/v1/email/accounts')
        .set('Authorization', `Bearer ${token}`)
        .send(makeAccountPayload({ displayName: 'Busca por ID' }));
      const accountId = createRes.body.account.id;
      const response = await request(app.server)
        .get(`/v1/email/accounts/${accountId}`)
        .set('Authorization', `Bearer ${token}`);
      expect(response.status).toBe(200);
      expect(response.body.account).toMatchObject({ id: accountId, displayName: 'Busca por ID' });
    });

    it('[FALHA] deve retornar 404 para ID inexistente', async () => {
      const response = await request(app.server)
        .get('/v1/email/accounts/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${token}`);
      expect(response.status).toBe(404);
    });

    it('[FALHA] deve retornar 401 sem autenticação', async () => {
      const response = await request(app.server)
        .get('/v1/email/accounts/00000000-0000-0000-0000-000000000000');
      expect(response.status).toBe(401);
    });
  });

  // ─── PATCH /v1/email/accounts/:id ───────────────────────────────────────
  describe('Atualizar conta (PATCH /v1/email/accounts/:id)', () => {
    it('[SUCESSO] deve atualizar displayName e signature', async () => {
      const createRes = await request(app.server)
        .post('/v1/email/accounts')
        .set('Authorization', `Bearer ${token}`)
        .send(makeAccountPayload({ displayName: 'Nome Original' }));
      const accountId = createRes.body.account.id;
      const response = await request(app.server)
        .patch(`/v1/email/accounts/${accountId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ displayName: 'Nome Atualizado', signature: 'Att, Teste' });
      expect(response.status).toBe(200);
      expect(response.body.account).toMatchObject({ displayName: 'Nome Atualizado', signature: 'Att, Teste' });
    });

    it('[FALHA] deve retornar 404 para conta inexistente', async () => {
      const response = await request(app.server)
        .patch('/v1/email/accounts/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${token}`)
        .send({ displayName: 'Qualquer' });
      expect(response.status).toBe(404);
    });

    it('[FALHA] deve retornar 400 com email inválido', async () => {
      const createRes = await request(app.server)
        .post('/v1/email/accounts')
        .set('Authorization', `Bearer ${token}`)
        .send(makeAccountPayload());
      const accountId = createRes.body.account.id;
      const response = await request(app.server)
        .patch(`/v1/email/accounts/${accountId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ address: 'invalido' });
      expect(response.status).toBe(400);
    });

    it('[FALHA] deve retornar 401 sem autenticação', async () => {
      const response = await request(app.server)
        .patch('/v1/email/accounts/00000000-0000-0000-0000-000000000000')
        .send({ displayName: 'x' });
      expect(response.status).toBe(401);
    });

    it('[FALHA] deve retornar 403 sem permissão', async () => {
      const createRes = await request(app.server)
        .post('/v1/email/accounts')
        .set('Authorization', `Bearer ${token}`)
        .send(makeAccountPayload());
      const accountId = createRes.body.account.id;
      const response = await request(app.server)
        .patch(`/v1/email/accounts/${accountId}`)
        .set('Authorization', `Bearer ${tokenNoPerms}`)
        .send({ displayName: 'x' });
      expect(response.status).toBe(403);
    });
  });

  // ─── DELETE /v1/email/accounts/:id ──────────────────────────────────────
  describe('Excluir conta (DELETE /v1/email/accounts/:id)', () => {
    it('[SUCESSO] deve excluir conta e retornar 204', async () => {
      const createRes = await request(app.server)
        .post('/v1/email/accounts')
        .set('Authorization', `Bearer ${token}`)
        .send(makeAccountPayload());
      const accountId = createRes.body.account.id;
      const response = await request(app.server)
        .delete(`/v1/email/accounts/${accountId}`)
        .set('Authorization', `Bearer ${token}`);
      expect(response.status).toBe(204);
    });

    it('[SUCESSO] conta excluída não deve ser encontrada (404)', async () => {
      const createRes = await request(app.server)
        .post('/v1/email/accounts')
        .set('Authorization', `Bearer ${token}`)
        .send(makeAccountPayload());
      const accountId = createRes.body.account.id;
      await request(app.server).delete(`/v1/email/accounts/${accountId}`).set('Authorization', `Bearer ${token}`);
      const getRes = await request(app.server).get(`/v1/email/accounts/${accountId}`).set('Authorization', `Bearer ${token}`);
      expect(getRes.status).toBe(404);
    });

    it('[FALHA] deve retornar 404 para conta inexistente', async () => {
      const response = await request(app.server)
        .delete('/v1/email/accounts/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${token}`);
      expect(response.status).toBe(404);
    });

    it('[FALHA] deve retornar 401 sem autenticação', async () => {
      const response = await request(app.server)
        .delete('/v1/email/accounts/00000000-0000-0000-0000-000000000000');
      expect(response.status).toBe(401);
    });

    it('[FALHA] deve retornar 403 sem permissão', async () => {
      const createRes = await request(app.server)
        .post('/v1/email/accounts')
        .set('Authorization', `Bearer ${token}`)
        .send(makeAccountPayload());
      const accountId = createRes.body.account.id;
      const response = await request(app.server)
        .delete(`/v1/email/accounts/${accountId}`)
        .set('Authorization', `Bearer ${tokenNoPerms}`);
      expect(response.status).toBe(403);
    });
  });

  // ─── POST /v1/email/accounts/:id/sync ───────────────────────────────────
  describe('Disparar sincronização (POST /v1/email/accounts/:id/sync)', () => {
    it('[SUCESSO] deve enfileirar job e retornar 202', async () => {
      const createRes = await request(app.server)
        .post('/v1/email/accounts')
        .set('Authorization', `Bearer ${token}`)
        .send(makeAccountPayload());
      const accountId = createRes.body.account.id;
      const response = await request(app.server)
        .post(`/v1/email/accounts/${accountId}/sync`)
        .set('Authorization', `Bearer ${token}`);
      expect(response.status).toBe(202);
      expect(response.body).toHaveProperty('message');
    });

    it('[FALHA] deve retornar 404 para conta inexistente', async () => {
      const response = await request(app.server)
        .post('/v1/email/accounts/00000000-0000-0000-0000-000000000000/sync')
        .set('Authorization', `Bearer ${token}`);
      expect(response.status).toBe(404);
    });

    it('[FALHA] deve retornar 401 sem autenticação', async () => {
      const response = await request(app.server)
        .post('/v1/email/accounts/00000000-0000-0000-0000-000000000000/sync');
      expect(response.status).toBe(401);
    });

    it('[FALHA] deve retornar 403 sem permissão', async () => {
      const createRes = await request(app.server)
        .post('/v1/email/accounts')
        .set('Authorization', `Bearer ${token}`)
        .send(makeAccountPayload());
      const accountId = createRes.body.account.id;
      const response = await request(app.server)
        .post(`/v1/email/accounts/${accountId}/sync`)
        .set('Authorization', `Bearer ${tokenNoPerms}`);
      expect(response.status).toBe(403);
    });
  });

  // ─── POST /v1/email/accounts/:id/test ───────────────────────────────────
  describe('Testar conexão (POST /v1/email/accounts/:id/test)', () => {
    it('[FALHA] deve retornar 404 para conta inexistente', async () => {
      const response = await request(app.server)
        .post('/v1/email/accounts/00000000-0000-0000-0000-000000000000/test')
        .set('Authorization', `Bearer ${token}`);
      expect(response.status).toBe(404);
    });

    it('[FALHA] deve retornar 401 sem autenticação', async () => {
      const response = await request(app.server)
        .post('/v1/email/accounts/00000000-0000-0000-0000-000000000000/test');
      expect(response.status).toBe(401);
    });

    it('[COMPORTAMENTO] deve responder com status conhecido para credenciais falsas', async () => {
      const createRes = await request(app.server)
        .post('/v1/email/accounts')
        .set('Authorization', `Bearer ${token}`)
        .send(makeAccountPayload());
      const accountId = createRes.body.account.id;
      const response = await request(app.server)
        .post(`/v1/email/accounts/${accountId}/test`)
        .set('Authorization', `Bearer ${token}`);
      // 204 = conexão ok | 400 = falha de conexão | 500 = erro inesperado
      expect([204, 400, 500]).toContain(response.status);
    });
  });

  // ─── POST /v1/email/accounts/:id/share ──────────────────────────────────
  describe('Compartilhar conta (POST /v1/email/accounts/:id/share)', () => {
    it('[SUCESSO] deve compartilhar conta com outro usuário', async () => {
      const createRes = await request(app.server)
        .post('/v1/email/accounts')
        .set('Authorization', `Bearer ${token}`)
        .send(makeAccountPayload());
      const accountId = createRes.body.account.id;
      const response = await request(app.server)
        .post(`/v1/email/accounts/${accountId}/share`)
        .set('Authorization', `Bearer ${token}`)
        .send({ userId: secondUserId, canRead: true, canSend: false, canManage: false });
      expect(response.status).toBe(201);
      expect(response.body.access).toMatchObject({ accountId, userId: secondUserId, canRead: true });
    });

    it('[COMPORTAMENTO] deve ser idempotente ao compartilhar o mesmo usuário duas vezes', async () => {
      const createRes = await request(app.server)
        .post('/v1/email/accounts')
        .set('Authorization', `Bearer ${token}`)
        .send(makeAccountPayload());
      const accountId = createRes.body.account.id;
      const sharePayload = { userId: secondUserId, canRead: true, canSend: false, canManage: false };
      await request(app.server)
        .post(`/v1/email/accounts/${accountId}/share`)
        .set('Authorization', `Bearer ${token}`)
        .send(sharePayload);
      const response = await request(app.server)
        .post(`/v1/email/accounts/${accountId}/share`)
        .set('Authorization', `Bearer ${token}`)
        .send(sharePayload);
      expect(response.status).toBe(201); // upsert: idempotente
    });

    it('[FALHA] deve retornar 404 para usuário inexistente', async () => {
      const createRes = await request(app.server)
        .post('/v1/email/accounts')
        .set('Authorization', `Bearer ${token}`)
        .send(makeAccountPayload());
      const accountId = createRes.body.account.id;
      const response = await request(app.server)
        .post(`/v1/email/accounts/${accountId}/share`)
        .set('Authorization', `Bearer ${token}`)
        .send({ userId: '00000000-0000-0000-0000-000000000000', canRead: true });
      expect(response.status).toBe(404);
    });

    it('[FALHA] deve retornar 401 sem autenticação', async () => {
      const response = await request(app.server)
        .post('/v1/email/accounts/00000000-0000-0000-0000-000000000000/share')
        .send({ userId: secondUserId, canRead: true });
      expect(response.status).toBe(401);
    });

    it('[FALHA] deve retornar 403 sem permissão de compartilhar', async () => {
      const createRes = await request(app.server)
        .post('/v1/email/accounts')
        .set('Authorization', `Bearer ${token}`)
        .send(makeAccountPayload());
      const accountId = createRes.body.account.id;
      const response = await request(app.server)
        .post(`/v1/email/accounts/${accountId}/share`)
        .set('Authorization', `Bearer ${tokenNoPerms}`)
        .send({ userId: secondUserId, canRead: true });
      expect(response.status).toBe(403);
    });
  });

  // ─── DELETE /v1/email/accounts/:id/share/:userId ─────────────────────────
  describe('Revogar compartilhamento (DELETE /v1/email/accounts/:id/share/:userId)', () => {
    it('[SUCESSO] deve revogar acesso compartilhado e retornar 204', async () => {
      const createRes = await request(app.server)
        .post('/v1/email/accounts')
        .set('Authorization', `Bearer ${token}`)
        .send(makeAccountPayload());
      const accountId = createRes.body.account.id;
      await request(app.server)
        .post(`/v1/email/accounts/${accountId}/share`)
        .set('Authorization', `Bearer ${token}`)
        .send({ userId: secondUserId, canRead: true, canSend: false, canManage: false });
      const response = await request(app.server)
        .delete(`/v1/email/accounts/${accountId}/share/${secondUserId}`)
        .set('Authorization', `Bearer ${token}`);
      expect(response.status).toBe(204);
    });

    it('[COMPORTAMENTO] revoke de acesso inexistente retorna 204 silenciosamente', async () => {
      const createRes = await request(app.server)
        .post('/v1/email/accounts')
        .set('Authorization', `Bearer ${token}`)
        .send(makeAccountPayload());
      const accountId = createRes.body.account.id;
      const response = await request(app.server)
        .delete(`/v1/email/accounts/${accountId}/share/00000000-0000-0000-0000-000000000000`)
        .set('Authorization', `Bearer ${token}`);
      expect(response.status).toBe(204); // deleteMany: sem erro se não encontrou
    });

    it('[FALHA] deve retornar 401 sem autenticação', async () => {
      const response = await request(app.server)
        .delete('/v1/email/accounts/00000000-0000-0000-0000-000000000000/share/00000000-0000-0000-0000-000000000000');
      expect(response.status).toBe(401);
    });
  });
});
