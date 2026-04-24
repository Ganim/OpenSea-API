import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { EvidenceFileNotFoundError } from '@/@errors/use-cases/evidence-file-not-found-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { PunchApproval } from '@/entities/hr/punch-approval';
import { InMemoryPunchApprovalsRepository } from '@/repositories/hr/in-memory/in-memory-punch-approvals-repository';
import { ResolvePunchApprovalUseCase } from './resolve-punch-approval';

let repo: InMemoryPunchApprovalsRepository;
let sut: ResolvePunchApprovalUseCase;
let tenantId: string;

async function seedPending() {
  const approval = PunchApproval.create({
    tenantId: new UniqueEntityID(tenantId),
    timeEntryId: new UniqueEntityID(),
    employeeId: new UniqueEntityID(),
    reason: 'OUT_OF_GEOFENCE',
  });
  await repo.create(approval);
  return approval;
}

describe('ResolvePunchApprovalUseCase', () => {
  beforeEach(() => {
    repo = new InMemoryPunchApprovalsRepository();
    sut = new ResolvePunchApprovalUseCase(repo);
    tenantId = new UniqueEntityID().toString();
  });

  it('APPROVE: atualiza status para APPROVED e persiste resolverUserId/resolvedAt/note', async () => {
    const approval = await seedPending();

    const result = await sut.execute({
      tenantId,
      approvalId: approval.id.toString(),
      decision: 'APPROVE',
      resolverUserId: 'user-01',
      note: 'verificado por GPS alternativo',
    });

    expect(result.status).toBe('APPROVED');
    expect(result.approvalId).toBe(approval.id.toString());
    expect(result.resolvedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);

    // Persisted state
    const stored = await repo.findById(approval.id, tenantId);
    expect(stored?.status).toBe('APPROVED');
    expect(stored?.resolverUserId?.toString()).toBe('user-01');
    expect(stored?.resolverNote).toBe('verificado por GPS alternativo');
    expect(stored?.resolvedAt).toBeInstanceOf(Date);
  });

  it('REJECT: atualiza status para REJECTED', async () => {
    const approval = await seedPending();

    const result = await sut.execute({
      tenantId,
      approvalId: approval.id.toString(),
      decision: 'REJECT',
      resolverUserId: 'user-02',
      note: 'sem justificativa',
    });

    expect(result.status).toBe('REJECTED');

    const stored = await repo.findById(approval.id, tenantId);
    expect(stored?.status).toBe('REJECTED');
    expect(stored?.resolverNote).toBe('sem justificativa');
  });

  it('APPROVE sem note deixa resolverNote null no DTO e undefined na entity', async () => {
    const approval = await seedPending();

    const result = await sut.execute({
      tenantId,
      approvalId: approval.id.toString(),
      decision: 'APPROVE',
      resolverUserId: 'user-01',
    });

    expect(result.status).toBe('APPROVED');

    const stored = await repo.findById(approval.id, tenantId);
    expect(stored?.resolverNote).toBeUndefined();
  });

  it('double-resolve lança BadRequestError (preserva audit)', async () => {
    const approval = await seedPending();

    await sut.execute({
      tenantId,
      approvalId: approval.id.toString(),
      decision: 'APPROVE',
      resolverUserId: 'user-01',
    });

    await expect(
      sut.execute({
        tenantId,
        approvalId: approval.id.toString(),
        decision: 'REJECT',
        resolverUserId: 'user-02',
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('decision inválido lança BadRequestError antes de tocar o repo', async () => {
    const approval = await seedPending();

    await expect(
      sut.execute({
        tenantId,
        approvalId: approval.id.toString(),
        // @ts-expect-error — testando runtime validation
        decision: 'FOO',
        resolverUserId: 'user-01',
      }),
    ).rejects.toBeInstanceOf(BadRequestError);

    // State não alterado
    const stored = await repo.findById(approval.id, tenantId);
    expect(stored?.status).toBe('PENDING');
  });

  it('approvalId inexistente lança ResourceNotFoundError', async () => {
    await expect(
      sut.execute({
        tenantId,
        approvalId: new UniqueEntityID().toString(),
        decision: 'APPROVE',
        resolverUserId: 'user-01',
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('tenant mismatch lança ResourceNotFoundError (isolamento multi-tenant)', async () => {
    const approval = await seedPending();
    const otherTenant = new UniqueEntityID().toString();

    await expect(
      sut.execute({
        tenantId: otherTenant,
        approvalId: approval.id.toString(),
        decision: 'APPROVE',
        resolverUserId: 'user-01',
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  // ──────────────────────────────────────────────────────────────────
  // Phase 7 / Plan 07-03 — D-10: evidenceFileKeys + linkedRequestId
  // ──────────────────────────────────────────────────────────────────

  it('APPROVE com evidenceFileKeys válidas anexa evidências + grava linkedRequestId', async () => {
    const approval = await seedPending();
    const headObject = vi
      .fn()
      .mockResolvedValue({
        contentLength: 2048,
        contentType: 'application/pdf',
      });
    sut = new ResolvePunchApprovalUseCase(repo, undefined, undefined, {
      headObject,
    });

    await sut.execute({
      tenantId,
      approvalId: approval.id.toString(),
      decision: 'APPROVE',
      resolverUserId: 'user-01',
      evidenceFileKeys: [
        'tenantX/punch-approvals/abc/evidence/uuid-1.pdf',
        'tenantX/punch-approvals/abc/evidence/uuid-2.pdf',
      ],
      linkedRequestId: new UniqueEntityID().toString(),
    });

    expect(headObject).toHaveBeenCalledTimes(2);

    const stored = await repo.findById(approval.id, tenantId);
    expect(stored?.evidenceFiles).toHaveLength(2);
    expect(stored?.evidenceFiles[0].storageKey).toMatch(/uuid-1\.pdf$/);
    expect(stored?.evidenceFiles[0].size).toBe(2048);
    expect(stored?.evidenceFiles[0].uploadedBy).toBe('user-01');
    expect(stored?.linkedRequestId).not.toBeNull();
  });

  it('evidenceFileKey que não existe no S3 (headObject returns null) lança EvidenceFileNotFoundError', async () => {
    const approval = await seedPending();
    const headObject = vi.fn().mockResolvedValue(null);
    sut = new ResolvePunchApprovalUseCase(repo, undefined, undefined, {
      headObject,
    });

    await expect(
      sut.execute({
        tenantId,
        approvalId: approval.id.toString(),
        decision: 'APPROVE',
        resolverUserId: 'user-01',
        evidenceFileKeys: ['phantom/key.pdf'],
      }),
    ).rejects.toBeInstanceOf(EvidenceFileNotFoundError);

    // Aprovação NÃO deve ter sido persistida
    const stored = await repo.findById(approval.id, tenantId);
    expect(stored?.evidenceFiles).toHaveLength(0);
  });

  it('evidenceFileKeys sem fileUploadService injetado lança BadRequestError', async () => {
    const approval = await seedPending();
    // `sut` default (beforeEach) — sem fileUploadService

    await expect(
      sut.execute({
        tenantId,
        approvalId: approval.id.toString(),
        decision: 'APPROVE',
        resolverUserId: 'user-01',
        evidenceFileKeys: ['foo/bar.pdf'],
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });
});
