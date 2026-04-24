import { beforeEach, describe, expect, it, vi } from 'vitest';

import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { PunchApproval } from '@/entities/hr/punch-approval';
import { InMemoryPunchApprovalsRepository } from '@/repositories/hr/in-memory/in-memory-punch-approvals-repository';

import { BatchResolvePunchApprovalsUseCase } from './batch-resolve-punch-approvals';

let repo: InMemoryPunchApprovalsRepository;
let sut: BatchResolvePunchApprovalsUseCase;
let tenantId: string;

async function seedN(count: number): Promise<string[]> {
  const ids: string[] = [];
  for (let i = 0; i < count; i++) {
    const a = PunchApproval.create({
      tenantId: new UniqueEntityID(tenantId),
      timeEntryId: new UniqueEntityID(),
      employeeId: new UniqueEntityID(),
      reason: 'OUT_OF_GEOFENCE',
    });
    await repo.create(a);
    ids.push(a.id.toString());
  }
  return ids;
}

describe('BatchResolvePunchApprovalsUseCase', () => {
  beforeEach(() => {
    repo = new InMemoryPunchApprovalsRepository();
    tenantId = new UniqueEntityID().toString();
    sut = new BatchResolvePunchApprovalsUseCase(repo);
  });

  it('3/3 aprovações resolvidas com sucesso', async () => {
    const ids = await seedN(3);

    const result = await sut.execute({
      tenantId,
      resolverUserId: 'user-01',
      approvalIds: ids,
      decision: 'APPROVE',
      note: 'ok',
    });

    expect(result.totalSucceeded).toBe(3);
    expect(result.totalFailed).toBe(0);
    expect(result.results.every((r) => r.success)).toBe(true);

    for (const id of ids) {
      const stored = await repo.findById(new UniqueEntityID(id), tenantId);
      expect(stored?.status).toBe('APPROVED');
    }
  });

  it('Promise.allSettled: 1 falha (id inexistente) não aborta as 2 outras', async () => {
    const ids = await seedN(2);
    const phantomId = new UniqueEntityID().toString();

    const result = await sut.execute({
      tenantId,
      resolverUserId: 'user-01',
      approvalIds: [...ids, phantomId],
      decision: 'REJECT',
    });

    expect(result.totalSucceeded).toBe(2);
    expect(result.totalFailed).toBe(1);

    const failed = result.results.find((r) => r.approvalId === phantomId);
    expect(failed?.success).toBe(false);
    expect(failed?.error).toMatch(/não encontrada|not found/i);

    // As duas aprovações legítimas foram rejeitadas
    for (const id of ids) {
      const stored = await repo.findById(new UniqueEntityID(id), tenantId);
      expect(stored?.status).toBe('REJECTED');
    }
  });

  it('approvalIds vazio → retorna totals 0 sem chamar repositório', async () => {
    const result = await sut.execute({
      tenantId,
      resolverUserId: 'user-01',
      approvalIds: [],
      decision: 'APPROVE',
    });

    expect(result.results).toEqual([]);
    expect(result.totalSucceeded).toBe(0);
    expect(result.totalFailed).toBe(0);
  });

  it('approvalIds.length > 100 lança erro anti-DoS', async () => {
    const ids = Array.from({ length: 101 }, () =>
      new UniqueEntityID().toString(),
    );

    await expect(
      sut.execute({
        tenantId,
        resolverUserId: 'user-01',
        approvalIds: ids,
        decision: 'APPROVE',
      }),
    ).rejects.toThrow(/> 100/);
  });

  it('propaga evidenceFileKeys + linkedRequestId para o single use case', async () => {
    const ids = await seedN(2);
    const headObject = vi
      .fn()
      .mockResolvedValue({
        contentLength: 1024,
        contentType: 'application/pdf',
      });
    sut = new BatchResolvePunchApprovalsUseCase(repo, undefined, {
      headObject,
    });

    const evidenceKey = 'tenantX/punch-approvals/xyz/evidence/batch.pdf';
    const requestId = new UniqueEntityID().toString();

    const result = await sut.execute({
      tenantId,
      resolverUserId: 'user-01',
      approvalIds: ids,
      decision: 'APPROVE',
      evidenceFileKeys: [evidenceKey],
      linkedRequestId: requestId,
    });

    expect(result.totalSucceeded).toBe(2);
    // headObject é chamado 1× por aprovação (2 IDs × 1 key = 2 chamadas)
    expect(headObject).toHaveBeenCalledTimes(2);

    for (const id of ids) {
      const stored = await repo.findById(new UniqueEntityID(id), tenantId);
      expect(stored?.evidenceFiles).toHaveLength(1);
      expect(stored?.evidenceFiles[0].storageKey).toBe(evidenceKey);
      expect(stored?.linkedRequestId?.toString()).toBe(requestId);
    }
  });
});
