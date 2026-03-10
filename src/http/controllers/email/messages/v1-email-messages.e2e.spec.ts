import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const ALL_EMAIL_PERMISSIONS = [
  'email.accounts.create',
  'email.accounts.read',
  'email.accounts.list',
  'email.messages.send',
  'email.messages.list',
  'email.messages.read',
  'email.messages.update',
  'email.messages.delete',
  'email.sync.execute',
];

describe('Email Messages Controller (E2E)', () => {
  let tenantId: string;
  let token: string;
  let tokenNoPerms: string;
  let accountId: string;
  // IDs preenchidos após criação de mensagens via send
  let sentMessageId: string;
  let sentFolderId: string;
  let trashFolderId: string;

  beforeAll(async () => {
    await app.ready();

    const { tenantId: tid } = await createAndSetupTenant({
      name: 'Test Email Messages Tenant',
    });
    tenantId = tid;

    const authResult = await createAndAuthenticateUser(app, {
      tenantId,
      permissions: ALL_EMAIL_PERMISSIONS,
    });
    token = authResult.token;

    const noPermsResult = await createAndAuthenticateUser(app, {
      tenantId,
      permissions: [],
    });
    tokenNoPerms = noPermsResult.token;

    // Criar conta de email
    const createAccountRes = await request(app.server)
      .post('/v1/email/accounts')
      .set('Authorization', `Bearer ${token}`)
      .send({
        address: 'messages-test@example.com',
        imapHost: 'imap.gmail.com',
        imapPort: 993,
        smtpHost: 'smtp.gmail.com',
        smtpPort: 587,
        username: 'messages-test@example.com',
        secret: 'app-password',
      });
    accountId = createAccountRes.body.account.id;

    // Criar pastas diretamente no DB (send é assíncrono, não cria pastas imediatamente)
    const sentFolder = await prisma.emailFolder.create({
      data: {
        accountId,
        remoteName: 'SENT',
        displayName: 'Enviados',
        type: 'SENT',
      },
    });
    sentFolderId = sentFolder.id;

    await prisma.emailFolder.create({
      data: {
        accountId,
        remoteName: 'DRAFTS',
        displayName: 'Rascunhos',
        type: 'DRAFTS',
      },
    });

    const trashFolder = await prisma.emailFolder.create({
      data: {
        accountId,
        remoteName: 'TRASH',
        displayName: 'Lixeira',
        type: 'TRASH',
      },
    });
    trashFolderId = trashFolder.id;

    // Criar uma mensagem diretamente no DB para usar nos testes de GET/PATCH/etc.
    const testMsg = await prisma.emailMessage.create({
      data: {
        tenantId,
        accountId,
        folderId: sentFolderId,
        remoteUid: 1001,
        fromAddress: 'sender@example.com',
        fromName: 'Sender Test',
        toAddresses: ['recipient@example.com'],
        subject: 'Mensagem de Teste Setup',
        receivedAt: new Date(),
      },
    });
    sentMessageId = testMsg.id;
  });

  afterAll(async () => {
    await app.close();
  });

  // ─── POST /v1/email/messages/send ────────────────────────────────────────
  describe('Enviar mensagem (POST /v1/email/messages/send)', () => {
    it('[SUCESSO] deve enviar e retornar 202 com messageId', async () => {
      const response = await request(app.server)
        .post('/v1/email/messages/send')
        .set('Authorization', `Bearer ${token}`)
        .send({
          accountId,
          to: ['dest@example.com'],
          subject: 'Teste Envio',
          bodyHtml: '<p>Olá</p>',
        });
      expect(response.status).toBe(202);
      expect(response.body).toHaveProperty('messageId');
      expect(typeof response.body.messageId).toBe('string');
    });

    it('[SUCESSO] deve enviar com cc e bcc', async () => {
      const response = await request(app.server)
        .post('/v1/email/messages/send')
        .set('Authorization', `Bearer ${token}`)
        .send({
          accountId,
          to: ['dest@example.com'],
          cc: ['cc@example.com'],
          bcc: ['bcc@example.com'],
          subject: 'Com CC e BCC',
          bodyHtml: '<p>Cópia</p>',
        });
      expect(response.status).toBe(202);
      expect(response.body).toHaveProperty('messageId');
    });

    it('[FALHA] deve retornar 400 quando "to" está ausente', async () => {
      const response = await request(app.server)
        .post('/v1/email/messages/send')
        .set('Authorization', `Bearer ${token}`)
        .send({ accountId, subject: 'Sem destinatário', bodyHtml: '<p>x</p>' });
      expect(response.status).toBe(400);
    });

    it('[FALHA] deve retornar 400 quando "to" é array vazio', async () => {
      const response = await request(app.server)
        .post('/v1/email/messages/send')
        .set('Authorization', `Bearer ${token}`)
        .send({ accountId, to: [], subject: 'Sem dest', bodyHtml: '<p>x</p>' });
      expect(response.status).toBe(400);
    });

    it('[FALHA] deve retornar 400 quando subject está ausente', async () => {
      const response = await request(app.server)
        .post('/v1/email/messages/send')
        .set('Authorization', `Bearer ${token}`)
        .send({ accountId, to: ['dest@example.com'], bodyHtml: '<p>x</p>' });
      expect(response.status).toBe(400);
    });

    it('[FALHA] deve retornar 400 quando bodyHtml está ausente', async () => {
      const response = await request(app.server)
        .post('/v1/email/messages/send')
        .set('Authorization', `Bearer ${token}`)
        .send({ accountId, to: ['dest@example.com'], subject: 'Sem body' });
      expect(response.status).toBe(400);
    });

    it('[FALHA] deve retornar 404 para accountId inexistente', async () => {
      const response = await request(app.server)
        .post('/v1/email/messages/send')
        .set('Authorization', `Bearer ${token}`)
        .send({
          accountId: '00000000-0000-0000-0000-000000000000',
          to: ['dest@example.com'],
          subject: 'Conta Inexistente',
          bodyHtml: '<p>x</p>',
        });
      expect(response.status).toBe(404);
    });

    it('[FALHA] deve retornar 401 sem autenticação', async () => {
      const response = await request(app.server)
        .post('/v1/email/messages/send')
        .send({
          accountId,
          to: ['dest@example.com'],
          subject: 'x',
          bodyHtml: '<p>x</p>',
        });
      expect(response.status).toBe(401);
    });

    it('[FALHA] deve retornar 403 sem permissão', async () => {
      const response = await request(app.server)
        .post('/v1/email/messages/send')
        .set('Authorization', `Bearer ${tokenNoPerms}`)
        .send({
          accountId,
          to: ['dest@example.com'],
          subject: 'x',
          bodyHtml: '<p>x</p>',
        });
      expect(response.status).toBe(403);
    });
  });

  // ─── GET /v1/email/messages ──────────────────────────────────────────────
  describe('Listar mensagens (GET /v1/email/messages)', () => {
    it('[SUCESSO] deve listar mensagens da conta', async () => {
      const response = await request(app.server)
        .get('/v1/email/messages')
        .set('Authorization', `Bearer ${token}`)
        .query({ accountId });
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('meta');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('[SUCESSO] deve listar mensagens filtradas por pasta', async () => {
      if (!sentFolderId) return;
      const response = await request(app.server)
        .get('/v1/email/messages')
        .set('Authorization', `Bearer ${token}`)
        .query({ accountId, folderId: sentFolderId });
      expect(response.status).toBe(200);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('[SUCESSO] deve retornar isFlagged na listagem', async () => {
      const response = await request(app.server)
        .get('/v1/email/messages')
        .set('Authorization', `Bearer ${token}`)
        .query({ accountId, folderId: sentFolderId });
      expect(response.status).toBe(200);
      expect(response.body.data.length).toBeGreaterThan(0);
      for (const msg of response.body.data) {
        expect(msg).toHaveProperty('isFlagged');
        expect(typeof msg.isFlagged).toBe('boolean');
      }
    });

    it('[SUCESSO] deve listar apenas não lidas com unread=true', async () => {
      const response = await request(app.server)
        .get('/v1/email/messages')
        .set('Authorization', `Bearer ${token}`)
        .query({ accountId, unread: true });
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.data)).toBe(true);
      // Mensagens retornadas devem ser todas não-lidas
      for (const msg of response.body.data) {
        expect(msg.isRead).toBe(false);
      }
    });

    it('[SUCESSO] deve respeitar paginação (page e limit)', async () => {
      const response = await request(app.server)
        .get('/v1/email/messages')
        .set('Authorization', `Bearer ${token}`)
        .query({ accountId, page: 1, limit: 2 });
      expect(response.status).toBe(200);
      expect(response.body.data.length).toBeLessThanOrEqual(2);
      expect(response.body.meta).toMatchObject({ page: 1, limit: 2 });
    });

    it('[FALHA] deve retornar 404 para accountId inexistente', async () => {
      const response = await request(app.server)
        .get('/v1/email/messages')
        .set('Authorization', `Bearer ${token}`)
        .query({ accountId: '00000000-0000-0000-0000-000000000000' });
      expect(response.status).toBe(404);
    });

    it('[FALHA] deve retornar 400 quando accountId está ausente', async () => {
      const response = await request(app.server)
        .get('/v1/email/messages')
        .set('Authorization', `Bearer ${token}`);
      expect(response.status).toBe(400);
    });

    it('[FALHA] deve retornar 401 sem autenticação', async () => {
      const response = await request(app.server)
        .get('/v1/email/messages')
        .query({ accountId });
      expect(response.status).toBe(401);
    });

    it('[FALHA] deve retornar 403 sem permissão', async () => {
      const response = await request(app.server)
        .get('/v1/email/messages')
        .set('Authorization', `Bearer ${tokenNoPerms}`)
        .query({ accountId });
      expect(response.status).toBe(403);
    });
  });

  // ─── GET /v1/email/messages/:id ──────────────────────────────────────────
  describe('Buscar mensagem por ID (GET /v1/email/messages/:id)', () => {
    it('[SUCESSO] deve retornar mensagem completa pelo ID', async () => {
      if (!sentMessageId) return;
      const response = await request(app.server)
        .get(`/v1/email/messages/${sentMessageId}`)
        .set('Authorization', `Bearer ${token}`);
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message.id).toBe(sentMessageId);
      expect(response.body.message).toHaveProperty('subject');
      expect(response.body.message).toHaveProperty('fromAddress');
    });

    it('[FALHA] deve retornar 404 para ID inexistente', async () => {
      const response = await request(app.server)
        .get('/v1/email/messages/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${token}`);
      expect(response.status).toBe(404);
    });

    it('[FALHA] deve retornar 401 sem autenticação', async () => {
      const response = await request(app.server).get(
        '/v1/email/messages/00000000-0000-0000-0000-000000000000',
      );
      expect(response.status).toBe(401);
    });

    it('[FALHA] deve retornar 403 sem permissão', async () => {
      if (!sentMessageId) return;
      const response = await request(app.server)
        .get(`/v1/email/messages/${sentMessageId}`)
        .set('Authorization', `Bearer ${tokenNoPerms}`);
      expect(response.status).toBe(403);
    });
  });

  // ─── POST /v1/email/messages/draft ───────────────────────────────────────
  describe('Salvar rascunho (POST /v1/email/messages/draft)', () => {
    it('[SUCESSO] deve salvar rascunho e retornar draftId', async () => {
      const response = await request(app.server)
        .post('/v1/email/messages/draft')
        .set('Authorization', `Bearer ${token}`)
        .send({
          accountId,
          subject: 'Rascunho E2E',
          bodyHtml: '<p>Rascunho</p>',
        });
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('draftId');
      expect(typeof response.body.draftId).toBe('string');
    });

    it('[SUCESSO] deve salvar rascunho sem destinatários (campos opcionais)', async () => {
      const response = await request(app.server)
        .post('/v1/email/messages/draft')
        .set('Authorization', `Bearer ${token}`)
        .send({ accountId });
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('draftId');
    });

    it('[SUCESSO] deve salvar rascunho com to, cc, bcc, subject e body', async () => {
      const response = await request(app.server)
        .post('/v1/email/messages/draft')
        .set('Authorization', `Bearer ${token}`)
        .send({
          accountId,
          to: ['dest@example.com'],
          cc: ['cc@example.com'],
          bcc: ['bcc@example.com'],
          subject: 'Rascunho Completo',
          bodyHtml: '<p>Rascunho completo</p>',
        });
      expect(response.status).toBe(201);
    });

    it('[FALHA] deve retornar 404 para accountId inexistente', async () => {
      const response = await request(app.server)
        .post('/v1/email/messages/draft')
        .set('Authorization', `Bearer ${token}`)
        .send({
          accountId: '00000000-0000-0000-0000-000000000000',
          subject: 'x',
        });
      expect(response.status).toBe(404);
    });

    it('[FALHA] deve retornar 401 sem autenticação', async () => {
      const response = await request(app.server)
        .post('/v1/email/messages/draft')
        .send({ accountId, subject: 'x' });
      expect(response.status).toBe(401);
    });

    it('[FALHA] deve retornar 403 sem permissão', async () => {
      const response = await request(app.server)
        .post('/v1/email/messages/draft')
        .set('Authorization', `Bearer ${tokenNoPerms}`)
        .send({ accountId, subject: 'x' });
      expect(response.status).toBe(403);
    });
  });

  // ─── PATCH /v1/email/messages/:id/read ───────────────────────────────────
  describe('Marcar como lida/não lida (PATCH /v1/email/messages/:id/read)', () => {
    it('[SUCESSO] deve marcar mensagem como lida', async () => {
      if (!sentMessageId) return;
      const response = await request(app.server)
        .patch(`/v1/email/messages/${sentMessageId}/read`)
        .set('Authorization', `Bearer ${token}`)
        .send({ isRead: true });
      expect(response.status).toBe(204);
    });

    it('[SUCESSO] deve marcar mensagem como não lida', async () => {
      if (!sentMessageId) return;
      const response = await request(app.server)
        .patch(`/v1/email/messages/${sentMessageId}/read`)
        .set('Authorization', `Bearer ${token}`)
        .send({ isRead: false });
      expect(response.status).toBe(204);

      // Verificar que realmente ficou não lida
      const getRes = await request(app.server)
        .get(`/v1/email/messages/${sentMessageId}`)
        .set('Authorization', `Bearer ${token}`);
      expect(getRes.body.message.isRead).toBe(false);
    });

    it('[FALHA] deve retornar 400 quando isRead está ausente', async () => {
      if (!sentMessageId) return;
      const response = await request(app.server)
        .patch(`/v1/email/messages/${sentMessageId}/read`)
        .set('Authorization', `Bearer ${token}`)
        .send({});
      expect(response.status).toBe(400);
    });

    it('[FALHA] deve retornar 404 para mensagem inexistente', async () => {
      const response = await request(app.server)
        .patch('/v1/email/messages/00000000-0000-0000-0000-000000000000/read')
        .set('Authorization', `Bearer ${token}`)
        .send({ isRead: true });
      expect(response.status).toBe(404);
    });

    it('[FALHA] deve retornar 401 sem autenticação', async () => {
      const response = await request(app.server)
        .patch('/v1/email/messages/00000000-0000-0000-0000-000000000000/read')
        .send({ isRead: true });
      expect(response.status).toBe(401);
    });

    it('[FALHA] deve retornar 403 sem permissão', async () => {
      if (!sentMessageId) return;
      const response = await request(app.server)
        .patch(`/v1/email/messages/${sentMessageId}/read`)
        .set('Authorization', `Bearer ${tokenNoPerms}`)
        .send({ isRead: true });
      expect(response.status).toBe(403);
    });
  });

  // ─── PATCH /v1/email/messages/:id/flag ───────────────────────────────────
  describe('Marcar com estrela (PATCH /v1/email/messages/:id/flag)', () => {
    it('[SUCESSO] deve marcar mensagem com estrela e persistir na listagem', async () => {
      if (!sentMessageId) return;

      // Toggle flag on
      const flagRes = await request(app.server)
        .patch(`/v1/email/messages/${sentMessageId}/flag`)
        .set('Authorization', `Bearer ${token}`)
        .send({ isFlagged: true });
      expect(flagRes.status).toBe(204);

      // Verify in list endpoint
      const listRes = await request(app.server)
        .get('/v1/email/messages')
        .set('Authorization', `Bearer ${token}`)
        .query({ accountId, folderId: sentFolderId });
      expect(listRes.status).toBe(200);
      const flaggedMsg = listRes.body.data.find((m: { id: string }) => m.id === sentMessageId);
      expect(flaggedMsg).toBeDefined();
      expect(flaggedMsg.isFlagged).toBe(true);
    });

    it('[SUCESSO] deve remover estrela e persistir na listagem', async () => {
      if (!sentMessageId) return;

      // Toggle flag off
      const flagRes = await request(app.server)
        .patch(`/v1/email/messages/${sentMessageId}/flag`)
        .set('Authorization', `Bearer ${token}`)
        .send({ isFlagged: false });
      expect(flagRes.status).toBe(204);

      // Verify in list endpoint
      const listRes = await request(app.server)
        .get('/v1/email/messages')
        .set('Authorization', `Bearer ${token}`)
        .query({ accountId, folderId: sentFolderId });
      expect(listRes.status).toBe(200);
      const unflaggedMsg = listRes.body.data.find((m: { id: string }) => m.id === sentMessageId);
      expect(unflaggedMsg).toBeDefined();
      expect(unflaggedMsg.isFlagged).toBe(false);
    });

    it('[SUCESSO] deve listar apenas mensagens com estrela usando flagged=true', async () => {
      if (!sentMessageId) return;

      // Ensure the message is flagged
      await request(app.server)
        .patch(`/v1/email/messages/${sentMessageId}/flag`)
        .set('Authorization', `Bearer ${token}`)
        .send({ isFlagged: true });

      const response = await request(app.server)
        .get('/v1/email/messages')
        .set('Authorization', `Bearer ${token}`)
        .query({ accountId, flagged: true });
      expect(response.status).toBe(200);
      for (const msg of response.body.data) {
        expect(msg.isFlagged).toBe(true);
      }

      // Cleanup: unflag
      await request(app.server)
        .patch(`/v1/email/messages/${sentMessageId}/flag`)
        .set('Authorization', `Bearer ${token}`)
        .send({ isFlagged: false });
    });

    it('[FALHA] deve retornar 404 para mensagem inexistente', async () => {
      const response = await request(app.server)
        .patch('/v1/email/messages/00000000-0000-0000-0000-000000000000/flag')
        .set('Authorization', `Bearer ${token}`)
        .send({ isFlagged: true });
      expect(response.status).toBe(404);
    });

    it('[FALHA] deve retornar 403 sem permissão', async () => {
      if (!sentMessageId) return;
      const response = await request(app.server)
        .patch(`/v1/email/messages/${sentMessageId}/flag`)
        .set('Authorization', `Bearer ${tokenNoPerms}`)
        .send({ isFlagged: true });
      expect(response.status).toBe(403);
    });
  });

  // ─── PATCH /v1/email/messages/:id/move ───────────────────────────────────
  describe('Mover mensagem (PATCH /v1/email/messages/:id/move)', () => {
    it('[SUCESSO] deve mover mensagem para a lixeira', async () => {
      // Criar mensagem diretamente no DB para mover
      const msgToMove = await prisma.emailMessage.create({
        data: {
          tenantId,
          accountId,
          folderId: sentFolderId,
          remoteUid: 2001,
          fromAddress: 'sender@example.com',
          toAddresses: ['recipient@example.com'],
          subject: 'Para Mover',
          receivedAt: new Date(),
        },
      });

      const response = await request(app.server)
        .patch(`/v1/email/messages/${msgToMove.id}/move`)
        .set('Authorization', `Bearer ${token}`)
        .send({ targetFolderId: trashFolderId });
      expect(response.status).toBe(204);

      // Verificar que a mensagem está agora na pasta destino
      const getRes = await request(app.server)
        .get(`/v1/email/messages/${msgToMove.id}`)
        .set('Authorization', `Bearer ${token}`);
      expect(getRes.body.message.folderId).toBe(trashFolderId);
    });

    it('[FALHA] deve retornar 404 para pasta de destino inexistente', async () => {
      if (!sentMessageId) return;
      const response = await request(app.server)
        .patch(`/v1/email/messages/${sentMessageId}/move`)
        .set('Authorization', `Bearer ${token}`)
        .send({ targetFolderId: '00000000-0000-0000-0000-000000000000' });
      expect(response.status).toBe(404);
    });

    it('[FALHA] deve retornar 404 para mensagem inexistente', async () => {
      const response = await request(app.server)
        .patch('/v1/email/messages/00000000-0000-0000-0000-000000000000/move')
        .set('Authorization', `Bearer ${token}`)
        .send({ targetFolderId: trashFolderId });
      expect(response.status).toBe(404);
    });

    it('[FALHA] deve retornar 400 quando targetFolderId está ausente', async () => {
      if (!sentMessageId) return;
      const response = await request(app.server)
        .patch(`/v1/email/messages/${sentMessageId}/move`)
        .set('Authorization', `Bearer ${token}`)
        .send({});
      expect(response.status).toBe(400);
    });

    it('[FALHA] deve retornar 401 sem autenticação', async () => {
      const response = await request(app.server)
        .patch('/v1/email/messages/00000000-0000-0000-0000-000000000000/move')
        .send({ targetFolderId: trashFolderId });
      expect(response.status).toBe(401);
    });

    it('[FALHA] deve retornar 403 sem permissão', async () => {
      if (!sentMessageId) return;
      const response = await request(app.server)
        .patch(`/v1/email/messages/${sentMessageId}/move`)
        .set('Authorization', `Bearer ${tokenNoPerms}`)
        .send({ targetFolderId: trashFolderId });
      expect(response.status).toBe(403);
    });
  });

  // ─── DELETE /v1/email/messages/:id ───────────────────────────────────────
  describe('Excluir mensagem (DELETE /v1/email/messages/:id)', () => {
    it('[SUCESSO] deve excluir mensagem e retornar 204', async () => {
      // Criar mensagem diretamente no DB para excluir
      const msgToDelete = await prisma.emailMessage.create({
        data: {
          tenantId,
          accountId,
          folderId: sentFolderId,
          remoteUid: 3001,
          fromAddress: 'sender@example.com',
          toAddresses: ['recipient@example.com'],
          subject: 'Para Excluir',
          receivedAt: new Date(),
        },
      });

      const response = await request(app.server)
        .delete(`/v1/email/messages/${msgToDelete.id}`)
        .set('Authorization', `Bearer ${token}`);
      expect(response.status).toBe(204);
    });

    it('[SUCESSO] mensagem excluída não deve ser encontrada (404)', async () => {
      const msgToDelete = await prisma.emailMessage.create({
        data: {
          tenantId,
          accountId,
          folderId: sentFolderId,
          remoteUid: 3002,
          fromAddress: 'sender@example.com',
          toAddresses: ['recipient@example.com'],
          subject: 'Para Excluir 2',
          receivedAt: new Date(),
        },
      });

      // First delete moves to trash
      await request(app.server)
        .delete(`/v1/email/messages/${msgToDelete.id}`)
        .set('Authorization', `Bearer ${token}`);
      // Second delete permanently soft-deletes
      await request(app.server)
        .delete(`/v1/email/messages/${msgToDelete.id}`)
        .set('Authorization', `Bearer ${token}`);
      const getRes = await request(app.server)
        .get(`/v1/email/messages/${msgToDelete.id}`)
        .set('Authorization', `Bearer ${token}`);
      expect(getRes.status).toBe(404);
    });

    it('[FALHA] deve retornar 404 para mensagem inexistente', async () => {
      const response = await request(app.server)
        .delete('/v1/email/messages/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${token}`);
      expect(response.status).toBe(404);
    });

    it('[FALHA] deve retornar 401 sem autenticação', async () => {
      const response = await request(app.server).delete(
        '/v1/email/messages/00000000-0000-0000-0000-000000000000',
      );
      expect(response.status).toBe(401);
    });

    it('[FALHA] deve retornar 403 sem permissão', async () => {
      const sendRes = await request(app.server)
        .post('/v1/email/messages/send')
        .set('Authorization', `Bearer ${token}`)
        .send({
          accountId,
          to: ['x@x.com'],
          subject: 'Sem Permissão Delete',
          bodyHtml: '<p>x</p>',
        });
      const msgId = sendRes.body.messageId;
      const response = await request(app.server)
        .delete(`/v1/email/messages/${msgId}`)
        .set('Authorization', `Bearer ${tokenNoPerms}`);
      expect(response.status).toBe(403);
    });
  });
});
