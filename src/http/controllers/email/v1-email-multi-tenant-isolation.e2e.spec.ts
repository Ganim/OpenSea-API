import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createEmailAccount } from '@/utils/tests/factories/core/create-email-account-test-data.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

const ALL_EMAIL_PERMISSIONS = [
  'email.accounts.create',
  'email.accounts.read',
  'email.accounts.update',
  'email.accounts.delete',
  'email.accounts.list',
  'email.accounts.share',
  'email.sync.execute',
  'email.messages.send',
  'email.messages.list',
  'email.messages.read',
  'email.messages.update',
  'email.messages.delete',
];

describe('Email Multi-Tenant Isolation (E2E)', () => {
  // Tenant A
  let tenantAId: string;
  let tokenA: string;
  let accountAId: string;
  let folderAId: string;
  let messageAId: string;

  // Tenant B
  let tenantBId: string;
  let tokenB: string;
  let accountBId: string;

  beforeAll(async () => {
    await app.ready();

    // ── Tenant A setup ──────────────────────────────────────────────────
    const { tenantId: tidA } = await createAndSetupTenant({
      name: 'Isolation Test - Tenant A',
    });
    tenantAId = tidA;

    const authA = await createAndAuthenticateUser(app, {
      tenantId: tenantAId,
      permissions: ALL_EMAIL_PERMISSIONS,
    });
    tokenA = authA.token;

    // Create account for Tenant A directly in DB
    const accA = await createEmailAccount(tenantAId, authA.user.user.id);
    accountAId = accA.id;

    // Create folder + message for Tenant A
    const folder = await prisma.emailFolder.create({
      data: {
        accountId: accountAId,
        remoteName: 'INBOX',
        displayName: 'Caixa de Entrada',
        type: 'INBOX',
      },
    });
    folderAId = folder.id;

    const msg = await prisma.emailMessage.create({
      data: {
        tenantId: tenantAId,
        accountId: accountAId,
        folderId: folderAId,
        remoteUid: 1001,
        fromAddress: 'sender-a@example.com',
        toAddresses: ['recipient@example.com'],
        subject: 'Tenant A - Confidential Message',
        receivedAt: new Date(),
        isRead: false,
      },
    });
    messageAId = msg.id;

    // ── Tenant B setup ──────────────────────────────────────────────────
    const { tenantId: tidB } = await createAndSetupTenant({
      name: 'Isolation Test - Tenant B',
    });
    tenantBId = tidB;

    const authB = await createAndAuthenticateUser(app, {
      tenantId: tenantBId,
      permissions: ALL_EMAIL_PERMISSIONS,
    });
    tokenB = authB.token;

    // Create account for Tenant B
    const accB = await createEmailAccount(tenantBId, authB.user.user.id);
    accountBId = accB.id;

    // Create INBOX folder for Tenant B
    await prisma.emailFolder.create({
      data: {
        accountId: accountBId,
        remoteName: 'INBOX',
        displayName: 'Caixa de Entrada',
        type: 'INBOX',
      },
    });
  }, 60000);


  // ── Account isolation ───────────────────────────────────────────────────

  it('should NOT list accounts from another tenant', async () => {
    const res = await request(app.server)
      .get('/v1/email/accounts')
      .set('Authorization', `Bearer ${tokenB}`)
      .expect(200);

    const accountIds = res.body.data.map((a: { id: string }) => a.id);
    expect(accountIds).not.toContain(accountAId);
  });

  it('should NOT get account details from another tenant', async () => {
    const res = await request(app.server)
      .get(`/v1/email/accounts/${accountAId}`)
      .set('Authorization', `Bearer ${tokenB}`);

    // Account belongs to Tenant A → Tenant B gets 404 (not found in their scope)
    expect(res.status).toBe(404);
  });

  it('should NOT update an account from another tenant', async () => {
    const res = await request(app.server)
      .patch(`/v1/email/accounts/${accountAId}`)
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ displayName: 'Hacked by Tenant B' });

    expect(res.status).toBe(404);
  });

  it('should NOT delete an account from another tenant', async () => {
    const res = await request(app.server)
      .delete(`/v1/email/accounts/${accountAId}`)
      .set('Authorization', `Bearer ${tokenB}`);

    expect(res.status).toBe(404);
  });

  // ── Folder isolation ────────────────────────────────────────────────────

  it('should NOT list folders of an account from another tenant', async () => {
    const res = await request(app.server)
      .get('/v1/email/folders')
      .query({ accountId: accountAId })
      .set('Authorization', `Bearer ${tokenB}`);

    // Account not found in Tenant B scope → 404
    expect(res.status).toBe(404);
  });

  // ── Message isolation ───────────────────────────────────────────────────

  it('should NOT list messages from an account in another tenant', async () => {
    const res = await request(app.server)
      .get('/v1/email/messages')
      .query({ accountId: accountAId })
      .set('Authorization', `Bearer ${tokenB}`);

    // Account not found in Tenant B scope → 404
    expect(res.status).toBe(404);
  });

  it('should NOT get a message from another tenant', async () => {
    const res = await request(app.server)
      .get(`/v1/email/messages/${messageAId}`)
      .set('Authorization', `Bearer ${tokenB}`);

    // Message belongs to Tenant A → not found for Tenant B
    expect(res.status).toBe(404);
  });

  it('should NOT mark a message from another tenant as read', async () => {
    const res = await request(app.server)
      .patch(`/v1/email/messages/${messageAId}/read`)
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ isRead: true });

    expect(res.status).toBe(404);
  });

  it('should NOT flag a message from another tenant', async () => {
    const res = await request(app.server)
      .patch(`/v1/email/messages/${messageAId}/flag`)
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ isFlagged: true });

    expect(res.status).toBe(404);
  });

  it('should NOT move a message from another tenant', async () => {
    const res = await request(app.server)
      .patch(`/v1/email/messages/${messageAId}/move`)
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ targetFolderId: randomUUID() });

    expect(res.status).toBe(404);
  });

  it('should NOT delete a message from another tenant', async () => {
    const res = await request(app.server)
      .delete(`/v1/email/messages/${messageAId}`)
      .set('Authorization', `Bearer ${tokenB}`);

    expect(res.status).toBe(404);
  });

  // ── Central inbox isolation ─────────────────────────────────────────────

  it('should NOT return messages from another tenant in central inbox', async () => {
    // Tenant B tries to query central inbox with Tenant A's account ID
    const res = await request(app.server)
      .get('/v1/email/messages/central-inbox')
      .query({ accountIds: accountAId })
      .set('Authorization', `Bearer ${tokenB}`);

    // Account is not visible to Tenant B → use case throws ForbiddenError (403)
    expect(res.status).toBe(403);
  });

  // ── Share isolation ─────────────────────────────────────────────────────

  it('should NOT share an account from another tenant', async () => {
    const res = await request(app.server)
      .post(`/v1/email/accounts/${accountAId}/share`)
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ userId: randomUUID(), canRead: true, canSend: false });

    // Account not found in Tenant B scope → 404
    expect(res.status).toBe(404);
  });

  // ── Contact suggestion isolation ────────────────────────────────────────

  it('should NOT return contacts from another tenant in suggestions', async () => {
    const res = await request(app.server)
      .get('/v1/email/messages/contacts/suggest')
      .query({ q: 'sender-a' })
      .set('Authorization', `Bearer ${tokenB}`)
      .expect(200);

    // Tenant B should not see contacts from Tenant A messages
    expect(res.body.contacts).toHaveLength(0);
  });

  // ── Verify Tenant A data is still intact ────────────────────────────────

  it('should still allow Tenant A to access their own data', async () => {
    // List accounts
    const accountsRes = await request(app.server)
      .get('/v1/email/accounts')
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(200);

    expect(
      accountsRes.body.data.some((a: { id: string }) => a.id === accountAId),
    ).toBe(true);

    // List messages
    const msgsRes = await request(app.server)
      .get('/v1/email/messages')
      .query({ accountId: accountAId })
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(200);

    expect(
      msgsRes.body.data.some((m: { id: string }) => m.id === messageAId),
    ).toBe(true);

    // Get specific message
    const msgRes = await request(app.server)
      .get(`/v1/email/messages/${messageAId}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(200);

    expect(msgRes.body.message.id).toBe(messageAId);
    expect(msgRes.body.message.subject).toBe('Tenant A - Confidential Message');
  });
});
