import { describe, expect, it } from 'vitest';
import { UniqueEntityID } from '../domain/unique-entity-id';
import { ComplianceArtifact } from './compliance-artifact';

describe('ComplianceArtifact Entity', () => {
  const baseProps = () => ({
    tenantId: new UniqueEntityID('tenant-01'),
    type: 'AFD' as const,
    storageKey: 'compliance/afd-2026-04.txt',
    contentHash: 'a'.repeat(64),
    sizeBytes: 1024,
    generatedBy: new UniqueEntityID('user-rh-01'),
  });

  it('cria artefato com defaults (generatedAt agora, deletedAt undefined)', () => {
    const before = new Date();
    const artifact = ComplianceArtifact.create(baseProps());
    const after = new Date();

    expect(artifact.type).toBe('AFD');
    expect(artifact.storageKey).toBe('compliance/afd-2026-04.txt');
    expect(artifact.contentHash).toBe('a'.repeat(64));
    expect(artifact.sizeBytes).toBe(1024);
    expect(artifact.generatedBy.toString()).toBe('user-rh-01');
    expect(artifact.generatedAt.getTime()).toBeGreaterThanOrEqual(
      before.getTime(),
    );
    expect(artifact.generatedAt.getTime()).toBeLessThanOrEqual(after.getTime());
    expect(artifact.deletedAt).toBeUndefined();
    expect(artifact.isDeleted).toBe(false);
  });

  it('aceita campos opcionais (periodStart, periodEnd, competencia, filters)', () => {
    const periodStart = new Date('2026-04-01T00:00:00Z');
    const periodEnd = new Date('2026-04-30T23:59:59Z');
    const filters = {
      departmentIds: ['dep-1', 'dep-2'],
      cnpj: '00.000.000/0001-00',
    };

    const artifact = ComplianceArtifact.create({
      ...baseProps(),
      periodStart,
      periodEnd,
      competencia: '2026-04',
      filters,
    });

    expect(artifact.periodStart).toEqual(periodStart);
    expect(artifact.periodEnd).toEqual(periodEnd);
    expect(artifact.competencia).toBe('2026-04');
    expect(artifact.filters).toEqual(filters);
  });

  it('softDelete() seta deletedAt e isDeleted retorna true', () => {
    const artifact = ComplianceArtifact.create(baseProps());
    expect(artifact.isDeleted).toBe(false);

    artifact.softDelete();

    expect(artifact.isDeleted).toBe(true);
    expect(artifact.deletedAt).toBeInstanceOf(Date);
  });

  it('softDelete() é idempotente — chamar 2x não muda deletedAt', () => {
    const artifact = ComplianceArtifact.create(baseProps());
    artifact.softDelete();
    const firstDeletedAt = artifact.deletedAt;

    artifact.softDelete();

    expect(artifact.deletedAt).toBe(firstDeletedAt);
  });

  it('permite fornecer generatedAt customizado (hydration do banco)', () => {
    const generatedAt = new Date('2026-03-15T08:30:00Z');
    const artifact = ComplianceArtifact.create({
      ...baseProps(),
      generatedAt,
    });

    expect(artifact.generatedAt).toEqual(generatedAt);
  });

  it('aceita id customizado', () => {
    const customId = new UniqueEntityID('artifact-abc');
    const artifact = ComplianceArtifact.create(baseProps(), customId);

    expect(artifact.id.toString()).toBe('artifact-abc');
  });

  it('preserva tipo S1200_XML, FOLHA_ESPELHO, RECIBO, AFDT', () => {
    const types = [
      'AFD',
      'AFDT',
      'FOLHA_ESPELHO',
      'RECIBO',
      'S1200_XML',
    ] as const;
    for (const type of types) {
      const artifact = ComplianceArtifact.create({ ...baseProps(), type });
      expect(artifact.type).toBe(type);
    }
  });
});
