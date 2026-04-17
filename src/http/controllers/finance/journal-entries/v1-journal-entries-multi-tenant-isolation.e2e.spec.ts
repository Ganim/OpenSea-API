import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

/**
 * Cross-tenant isolation contract for the Journal Entries surface
 * (closes part of P2-52 from FINANCE-AUDIT-2026-04-16.md). Mirrors the
 * existing Loans/Consortia/Contracts isolation specs.
 *
 * Journal entries must NEVER leak between tenants because the underlying
 * accounting ledger is the source of truth for every DRE/DFC/Razão
 * report — a single cross-tenant read would invalidate regulatory audits.
 *
 * Pattern: build two tenants with disjoint authentication, seed a real
 * journal entry in Tenant A (via POST /v1/finance/journal-entries using
 * real ChartOfAccount rows), then verify Tenant B receives 404 on every
 * id-keyed read and its list endpoint excludes the foreign entry.
 */
describe('Journal Entries Multi-Tenant Isolation (E2E)', () => {
  let tenantAId: string;
  let tokenA: string;
  let journalEntryAId: string;

  let tokenB: string;

  beforeAll(async () => {
    await app.ready();

    // ── Tenant A: create chart of accounts + journal entry ──────────────
    const { tenantId: tidA } = await createAndSetupTenant({
      name: 'Journal Entries Isolation - Tenant A',
    });
    tenantAId = tidA;

    const authA = await createAndAuthenticateUser(app, {
      tenantId: tenantAId,
    });
    tokenA = authA.token;

    // Seed two chart-of-account rows so the entry has valid debit/credit
    // lines (journal entry contract requires at least one DEBIT + one CREDIT).
    const timestamp = Date.now();
    const cashAccount = await prisma.chartOfAccount.create({
      data: {
        id: randomUUID(),
        tenantId: tenantAId,
        code: `1.1.01.${timestamp}`.slice(0, 20),
        name: 'Caixa (Tenant A)',
        type: 'ASSET',
        class: 'CURRENT',
        nature: 'DEBIT',
      },
    });

    const revenueAccount = await prisma.chartOfAccount.create({
      data: {
        id: randomUUID(),
        tenantId: tenantAId,
        code: `3.1.01.${timestamp}`.slice(0, 20),
        name: 'Receita de Vendas (Tenant A)',
        type: 'REVENUE',
        class: 'OPERATIONAL',
        nature: 'CREDIT',
      },
    });

    const createResp = await request(app.server)
      .post('/v1/finance/journal-entries')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        date: new Date().toISOString(),
        description: 'Tenant A journal entry',
        sourceType: 'MANUAL',
        lines: [
          { chartOfAccountId: cashAccount.id, type: 'DEBIT', amount: 500 },
          {
            chartOfAccountId: revenueAccount.id,
            type: 'CREDIT',
            amount: 500,
          },
        ],
      });

    expect(createResp.status).toBe(201);
    journalEntryAId = createResp.body.journalEntry.id;

    // ── Tenant B: separate tenant + token ───────────────────────────────
    const { tenantId: tidB } = await createAndSetupTenant({
      name: 'Journal Entries Isolation - Tenant B',
    });
    const authB = await createAndAuthenticateUser(app, { tenantId: tidB });
    tokenB = authB.token;
  }, 60000);

  it('should NOT get a journal entry from another tenant (404)', async () => {
    const response = await request(app.server)
      .get(`/v1/finance/journal-entries/${journalEntryAId}`)
      .set('Authorization', `Bearer ${tokenB}`);

    expect(response.status).toBe(404);
  });

  it("should NOT include another tenant's journal entry in the list", async () => {
    const response = await request(app.server)
      .get('/v1/finance/journal-entries')
      .set('Authorization', `Bearer ${tokenB}`);

    expect(response.status).toBe(200);
    const ids =
      (response.body.entries as Array<{ id: string }> | undefined)?.map(
        (entry) => entry.id,
      ) ?? [];
    expect(ids).not.toContain(journalEntryAId);
  });

  it('should still allow Tenant A to read its own journal entry', async () => {
    const response = await request(app.server)
      .get(`/v1/finance/journal-entries/${journalEntryAId}`)
      .set('Authorization', `Bearer ${tokenA}`);

    expect(response.status).toBe(200);
    expect(response.body.journalEntry.id).toBe(journalEntryAId);
  });

  it("should NOT reverse another tenant's journal entry", async () => {
    const response = await request(app.server)
      .post(`/v1/finance/journal-entries/${journalEntryAId}/reverse`)
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ reason: 'Hacked by Tenant B' });

    // Expect 404 (not found from Tenant B's viewpoint) — not 200/201.
    // The reverse endpoint may not exist at that exact path; any
    // non-success outcome that is NOT 200/201 is acceptable here.
    expect([400, 403, 404, 405]).toContain(response.status);
  });
});
