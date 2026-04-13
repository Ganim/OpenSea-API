vi.mock('@/lib/logger', () => ({
  logger: { warn: vi.fn(), info: vi.fn(), error: vi.fn() },
}));

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RoutineCheckUseCase } from './routine-check';

const mockCheckOverdueEntries = {
  execute: vi.fn(),
};

const mockProcessDueReminders = {
  execute: vi.fn(),
};

const mockPermissionService = {
  hasPermission: vi.fn(),
  checkPermission: vi.fn(),
  getUserPermissionCodes: vi.fn(),
  invalidateUserCache: vi.fn(),
  clearCache: vi.fn(),
};

let sut: RoutineCheckUseCase;

describe('RoutineCheckUseCase', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: user HAS finance permission
    mockPermissionService.hasPermission.mockResolvedValue(true);
    sut = new RoutineCheckUseCase(
      mockCheckOverdueEntries as never,
      mockProcessDueReminders as never,
      mockPermissionService as never,
    );
  });

  it('should return results from both sub-tasks when user has finance permission', async () => {
    mockCheckOverdueEntries.execute.mockResolvedValue({
      markedOverdue: 3,
      dueSoonAlerts: 5,
    });

    mockProcessDueReminders.execute.mockResolvedValue({
      processed: 10,
      errors: 1,
    });

    const result = await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
    });

    expect(result.finance).toEqual({ markedOverdue: 3, dueSoonAlerts: 5 });
    expect(result.calendarReminders).toEqual({ processed: 10, errors: 1 });
    expect(mockCheckOverdueEntries.execute).toHaveBeenCalledWith({
      tenantId: 'tenant-1',
      createdBy: 'user-1',
    });
  });

  it('should skip finance checks when user lacks finance permission', async () => {
    mockPermissionService.hasPermission.mockResolvedValue(false);

    mockProcessDueReminders.execute.mockResolvedValue({
      processed: 5,
      errors: 0,
    });

    const result = await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-without-finance',
    });

    expect(result.finance).toBeNull();
    expect(result.calendarReminders).toEqual({ processed: 5, errors: 0 });
    expect(mockCheckOverdueEntries.execute).not.toHaveBeenCalled();
  });

  it('should return null for finance when checkOverdueEntries fails', async () => {
    mockCheckOverdueEntries.execute.mockRejectedValue(new Error('DB error'));

    mockProcessDueReminders.execute.mockResolvedValue({
      processed: 2,
      errors: 0,
    });

    const result = await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
    });

    expect(result.finance).toBeNull();
    expect(result.calendarReminders).toEqual({ processed: 2, errors: 0 });
  });

  it('should return null for reminders when processDueReminders fails', async () => {
    mockCheckOverdueEntries.execute.mockResolvedValue({
      markedOverdue: 1,
      dueSoonAlerts: 0,
    });

    mockProcessDueReminders.execute.mockRejectedValue(
      new Error('Calendar error'),
    );

    const result = await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
    });

    expect(result.finance).toEqual({ markedOverdue: 1, dueSoonAlerts: 0 });
    expect(result.calendarReminders).toBeNull();
  });

  it('should return null for both when both fail', async () => {
    mockCheckOverdueEntries.execute.mockRejectedValue(new Error('fail-1'));
    mockProcessDueReminders.execute.mockRejectedValue(new Error('fail-2'));

    const result = await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
    });

    expect(result.finance).toBeNull();
    expect(result.calendarReminders).toBeNull();
  });
});
