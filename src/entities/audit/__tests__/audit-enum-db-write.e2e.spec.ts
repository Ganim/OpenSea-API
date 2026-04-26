/**
 * Sentinel tests — Phase 10 / Plan 10-01 (Pitfall 8 Layer 2: DB write)
 *
 * Validates that the new AuditAction + AuditEntity values added by migration
 * `20260426000000_add_punch_bio_agent` are actually present in the Postgres
 * `pg_enum` catalog (not just in the TS enum).
 *
 * Without the ALTER TYPE applied, Postgres raises:
 *   invalid input value for enum "AuditAction": "AGENT_PAIRED" (code 22P02)
 *
 * This test MUST run after the `db execute` + `migrate resolve` workaround
 * (Task 1.1 blocking step). It will fail if the migration has not been applied.
 *
 * Layer 1 (TS identity) is in audit-enum-sync.spec.ts (unit).
 */

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { prisma } from '@/lib/prisma';
import { AuditAction } from '../audit-action.enum';
import { AuditEntity } from '../audit-entity.enum';
import { AuditModule } from '../audit-module.enum';

describe('Phase 10 audit enum DB-write sentinel (Pitfall 8 deep check)', () => {
  let tenantId: string;
  const sentinelSlug = `phase10-sentinel-${Date.now()}`;

  beforeAll(async () => {
    const tenant = await prisma.tenant.create({
      data: {
        name: `Phase10 Audit Sentinel ${Date.now()}`,
        slug: sentinelSlug,
      },
    });
    tenantId = tenant.id;
  });

  afterAll(async () => {
    await prisma.auditLog.deleteMany({ where: { tenantId } });
    await prisma.tenant.delete({ where: { slug: sentinelSlug } });
  });

  it('logAudit writes AGENT_PAIRED + PUNCH_BIO_AGENT row (must_haves truth #8)', async () => {
    // This INSERT would fail with Postgres error 22P02 (invalid enum value)
    // if ALTER TYPE "AuditAction" ADD VALUE 'AGENT_PAIRED' has not been applied.
    await prisma.auditLog.create({
      data: {
        tenantId,
        action: AuditAction.AGENT_PAIRED as string,
        entity: AuditEntity.PUNCH_BIO_AGENT as string,
        module: AuditModule.HR as string,
        entityId: 'sentinel-device-id',
        description: 'Sentinel test for Phase 10 enum sync',
        newData: { deviceLabel: 'sentinel-device' },
      },
    });

    const count = await prisma.auditLog.count({
      where: {
        tenantId,
        action: 'AGENT_PAIRED',
        entity: 'PUNCH_BIO_AGENT',
      },
    });

    expect(count).toBeGreaterThanOrEqual(1);
  });

  it('BIO_ENROLLED is writable to DB (enum sync check)', async () => {
    await prisma.auditLog.create({
      data: {
        tenantId,
        action: AuditAction.BIO_ENROLLED as string,
        entity: AuditEntity.PUNCH_BIO_AGENT as string,
        module: AuditModule.HR as string,
        entityId: 'sentinel-employee-id',
        description: 'Sentinel test for BIO_ENROLLED',
      },
    });

    const count = await prisma.auditLog.count({
      where: { tenantId, action: 'BIO_ENROLLED' },
    });
    expect(count).toBeGreaterThanOrEqual(1);
  });

  it('AGENT_REVOKED is writable to DB (enum sync check)', async () => {
    await prisma.auditLog.create({
      data: {
        tenantId,
        action: AuditAction.AGENT_REVOKED as string,
        entity: AuditEntity.PUNCH_BIO_AGENT as string,
        module: AuditModule.HR as string,
        entityId: 'sentinel-device-revoke-id',
        description: 'Sentinel test for AGENT_REVOKED',
      },
    });

    const count = await prisma.auditLog.count({
      where: { tenantId, action: 'AGENT_REVOKED' },
    });
    expect(count).toBeGreaterThanOrEqual(1);
  });
});
