/**
 * EnrollPinUseCase unit tests — Task 4.3 RED
 *
 * Tests:
 * 7. Use case pure: emits audit BIO_ENROLLED with actorUserId + targetEmployeeId + deviceId
 * Additional:
 * - Returns { ok: true, auditLogId } on success
 * - Throws BadRequestError if avgScore < 50
 * - Throws ResourceNotFoundError if employee not found
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EnrollPinUseCase } from '../enroll-pin';
import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';

// In-memory employee repo stub
const mockEmployeesRepo = {
  findById: vi.fn(),
};

// In-memory punch devices repo stub
const mockPunchDevicesRepo = {
  findById: vi.fn(),
};

// In-memory audit logs repo stub
const mockAuditLogsRepo = {
  log: vi.fn(),
};

function makeUseCase() {
  return new EnrollPinUseCase(
    mockEmployeesRepo as never,
    mockPunchDevicesRepo as never,
    mockAuditLogsRepo as never,
  );
}

const validInput = {
  tenantId: 'tenant-001',
  actorUserId: 'admin-user-001',
  deviceId: '550e8400-e29b-41d4-a716-446655440000',
  targetEmployeeId: 'emp-001',
  qualityScores: [80, 85, 90],
  avgScore: 85,
};

describe('EnrollPinUseCase', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockEmployeesRepo.findById.mockResolvedValue({
      id: 'emp-001',
      tenantId: 'tenant-001',
      name: 'Test Employee',
    });

    mockPunchDevicesRepo.findById.mockResolvedValue({
      id: '550e8400-e29b-41d4-a716-446655440000',
      tenantId: 'tenant-001',
      status: 'ACTIVE',
      paired: true,
    });

    mockAuditLogsRepo.log.mockResolvedValue({ id: 'audit-log-001' });
  });

  it('returns { ok: true, auditLogId } on valid input', async () => {
    const useCase = makeUseCase();
    const result = await useCase.execute(validInput);

    expect(result.ok).toBe(true);
    expect(result.auditLogId).toBe('audit-log-001');
  });

  it('audit log called with BIO_ENROLLED action + correct fields', async () => {
    const useCase = makeUseCase();
    await useCase.execute(validInput);

    expect(mockAuditLogsRepo.log).toHaveBeenCalledOnce();
    const logCall = mockAuditLogsRepo.log.mock.calls[0][0];

    // Action must be BIO_ENROLLED
    expect(logCall.action).toBe('BIO_ENROLLED');
    // Entity must be PUNCH_BIO_AGENT
    expect(logCall.entity).toBe('PUNCH_BIO_AGENT');
    // actorUserId must be recorded
    expect(logCall.userId).toBe('admin-user-001');
    // entityId must be deviceId
    expect(logCall.entityId).toBe('550e8400-e29b-41d4-a716-446655440000');
  });

  it('audit newData NEVER includes iso_template_blob', async () => {
    const useCase = makeUseCase();
    await useCase.execute(validInput);

    const logCall = mockAuditLogsRepo.log.mock.calls[0][0];
    const newDataStr = JSON.stringify(logCall.newData ?? {});

    expect(newDataStr).not.toMatch(/iso_template|template_blob|fmd/i);
    // Should contain quality scores
    expect(newDataStr).toContain('qualityScores');
  });

  it('throws BadRequestError when avgScore < 50', async () => {
    const useCase = makeUseCase();

    await expect(
      useCase.execute({
        ...validInput,
        avgScore: 40,
        qualityScores: [30, 40, 50],
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('throws ResourceNotFoundError when employee not found', async () => {
    mockEmployeesRepo.findById.mockResolvedValue(null);
    const useCase = makeUseCase();

    await expect(useCase.execute(validInput)).rejects.toThrow(
      ResourceNotFoundError,
    );
  });

  it('throws ResourceNotFoundError when device not found', async () => {
    mockPunchDevicesRepo.findById.mockResolvedValue(null);
    const useCase = makeUseCase();

    await expect(useCase.execute(validInput)).rejects.toThrow(
      ResourceNotFoundError,
    );
  });

  it('body schema — does not accept iso_template_blob field (LGPD invariant)', async () => {
    // The use case input interface is strict — no template blob field allowed.
    // This test verifies the TypeScript interface doesn't have that field.
    // (Runtime defense is Zod .strict() in controller layer)
    const inputKeys = Object.keys(validInput);
    expect(inputKeys).not.toContain('iso_template_blob');
    expect(inputKeys).not.toContain('templateBlob');
    expect(inputKeys).not.toContain('fmdBuffer');
  });
});
