import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

describe('Email Folders Controller (E2E)', () => {
  let tenantId: string;
  let token: string;
  let tokenNoPerms: string;
  let accountId: string;
  let sentFolderId: string;

  beforeAll(async () => {
    await app.ready();

    const { tenantId: tid } = await createAndSetupTenant({
      name: 'Test Email Folders Tenant',
    });
    tenantId = tid;

    const authResult = await createAndAuthenticateUser(app, {
      tenantId,
      permissions: [
        'email.accounts.create',
        'email.accounts.read',
        'email.messages.read',
        'email.messages.send',
      ],
    });
    token = authResult.token;

    const noPermsResult = await createAndAuthenticateUser(app, {
      tenantId,
      permissions: [],
    });
    tokenNoPerms = noPermsResult.token;

    // Criar conta
    const createAccountRes = await request(app.server)
      .post('/v1/email/accounts')
      .set('Authorization', `Bearer ${token}`)
      .send({
        address: 'folders-test@example.com',
        imapHost: 'imap.gmail.com',
        imapPort: 993,
        smtpHost: 'smtp.gmail.com',
        smtpPort: 587,
        username: 'folders-test@example.com',
        secret: 'app-password',
      });
    accountId = createAccountRes.body.account.id;

    // Criar pasta SENT diretamente no DB para garantir dados no teste
    const sentFolder = await prisma.emailFolder.create({
      data: {
        accountId,
        remoteName: 'SENT',
        displayName: 'Enviados',
        type: 'SENT',
      },
    });
    sentFolderId = sentFolder.id;
  }, 60000);


  // --- GET /v1/email/folders -----------------------------------------------
  describe('Listar pastas (GET /v1/email/folders)', () => {
    it('[SUCESSO] deve listar pastas de uma conta', async () => {
      const response = await request(app.server)
        .get('/v1/email/folders')
        .set('Authorization', `Bearer ${token}`)
        .query({ accountId });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('[SUCESSO] deve incluir pasta SENT criada no banco', async () => {
      const response = await request(app.server)
        .get('/v1/email/folders')
        .set('Authorization', `Bearer ${token}`)
        .query({ accountId });

      expect(response.status).toBe(200);
      const folders: Array<{ id: string; type: string }> = response.body.data;
      const sentFolder = folders.find((f) => f.id === sentFolderId);
      expect(sentFolder).toBeDefined();
      expect(sentFolder?.type).toBe('SENT');
    });

    it('[SUCESSO] pastas devem ter os campos obrigatórios no schema', async () => {
      const response = await request(app.server)
        .get('/v1/email/folders')
        .set('Authorization', `Bearer ${token}`)
        .query({ accountId });

      expect(response.status).toBe(200);
      for (const folder of response.body.data) {
        expect(folder).toHaveProperty('id');
        expect(folder).toHaveProperty('accountId', accountId);
        expect(folder).toHaveProperty('remoteName');
        expect(folder).toHaveProperty('displayName');
        expect(folder).toHaveProperty('type');
        expect([
          'INBOX',
          'SENT',
          'DRAFTS',
          'TRASH',
          'SPAM',
          'CUSTOM',
        ]).toContain(folder.type);
      }
    });

    it('[FALHA] deve retornar 400 quando accountId está ausente', async () => {
      const response = await request(app.server)
        .get('/v1/email/folders')
        .set('Authorization', `Bearer ${token}`);
      // Zod validation falha quando query obrigatória está ausente
      expect(response.status).toBe(400);
    });

    it('[FALHA] deve retornar 400 quando accountId não é UUID válido', async () => {
      const response = await request(app.server)
        .get('/v1/email/folders')
        .set('Authorization', `Bearer ${token}`)
        .query({ accountId: 'nao-e-uuid' });
      expect(response.status).toBe(400);
    });

    it('[FALHA] deve retornar 404 para accountId inexistente', async () => {
      const response = await request(app.server)
        .get('/v1/email/folders')
        .set('Authorization', `Bearer ${token}`)
        .query({ accountId: '00000000-0000-0000-0000-000000000000' });
      expect(response.status).toBe(404);
    });

    it('[FALHA] deve retornar 401 sem autenticação', async () => {
      const response = await request(app.server)
        .get('/v1/email/folders')
        .query({ accountId });
      expect(response.status).toBe(401);
    });

    it('[FALHA] deve retornar 403 sem permissão', async () => {
      const response = await request(app.server)
        .get('/v1/email/folders')
        .set('Authorization', `Bearer ${tokenNoPerms}`)
        .query({ accountId });
      expect(response.status).toBe(403);
    });
  });
});
