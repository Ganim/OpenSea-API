import { describe, expect, it } from 'vitest';

import { UniqueEntityID } from '../domain/unique-entity-id';
import { PunchMissedLog } from './punch-missed-log';

describe('PunchMissedLog entity', () => {
  const baseProps = () => ({
    tenantId: new UniqueEntityID('tenant-1'),
    employeeId: new UniqueEntityID('employee-1'),
    date: new Date('2026-04-24T00:00:00.000Z'),
  });

  describe('create() factory', () => {
    it('defaults generatedAt to current time when omitted', () => {
      const before = Date.now();
      const log = PunchMissedLog.create(baseProps());
      const after = Date.now();

      expect(log.generatedAt).toBeInstanceOf(Date);
      expect(log.generatedAt.getTime()).toBeGreaterThanOrEqual(before);
      expect(log.generatedAt.getTime()).toBeLessThanOrEqual(after);
    });

    it('preserves explicit generatedAt when provided', () => {
      const generatedAt = new Date('2026-04-24T22:05:00.000Z');
      const log = PunchMissedLog.create({ ...baseProps(), generatedAt });
      expect(log.generatedAt).toBe(generatedAt);
    });

    it('accepts optional fields (shiftAssignmentId, expectedStart/End, generatedByJobId)', () => {
      const shiftAssignmentId = new UniqueEntityID('shift-assignment-42');
      const expectedStartTime = new Date('2026-04-24T08:00:00.000Z');
      const expectedEndTime = new Date('2026-04-24T17:00:00.000Z');
      const log = PunchMissedLog.create({
        ...baseProps(),
        shiftAssignmentId,
        expectedStartTime,
        expectedEndTime,
        generatedByJobId: 'bullmq-job-abc',
      });

      expect(log.shiftAssignmentId?.toString()).toBe('shift-assignment-42');
      expect(log.expectedStartTime).toBe(expectedStartTime);
      expect(log.expectedEndTime).toBe(expectedEndTime);
      expect(log.generatedByJobId).toBe('bullmq-job-abc');
    });

    it('applies custom id when provided', () => {
      const id = new UniqueEntityID('missing-log-id-1');
      const log = PunchMissedLog.create(baseProps(), id);
      expect(log.id.toString()).toBe('missing-log-id-1');
    });
  });

  describe('getters — initial state', () => {
    it('returns UniqueEntityID for tenantId/employeeId and Date for date', () => {
      const log = PunchMissedLog.create(baseProps());
      expect(log.tenantId.toString()).toBe('tenant-1');
      expect(log.employeeId.toString()).toBe('employee-1');
      expect(log.date).toBeInstanceOf(Date);
    });

    it('defaults optional fields to null when omitted', () => {
      const log = PunchMissedLog.create(baseProps());
      expect(log.shiftAssignmentId).toBeNull();
      expect(log.expectedStartTime).toBeNull();
      expect(log.expectedEndTime).toBeNull();
      expect(log.generatedByJobId).toBeNull();
      expect(log.resolvedAt).toBeNull();
      expect(log.resolutionType).toBeNull();
    });

    it('isResolved is false when resolvedAt is null/undefined', () => {
      const log = PunchMissedLog.create(baseProps());
      expect(log.isResolved).toBe(false);
    });
  });

  describe('markResolved()', () => {
    it('sets resolvedAt to current time and resolutionType to the provided value', () => {
      const log = PunchMissedLog.create(baseProps());
      expect(log.isResolved).toBe(false);

      const before = Date.now();
      log.markResolved('LATE_PUNCH');
      const after = Date.now();

      expect(log.isResolved).toBe(true);
      expect(log.resolutionType).toBe('LATE_PUNCH');
      expect(log.resolvedAt).toBeInstanceOf(Date);
      expect(log.resolvedAt!.getTime()).toBeGreaterThanOrEqual(before);
      expect(log.resolvedAt!.getTime()).toBeLessThanOrEqual(after);
    });

    it('overwrites existing resolution (idempotent on double-resolve)', () => {
      const log = PunchMissedLog.create({
        ...baseProps(),
        resolvedAt: new Date('2026-04-25T10:00:00.000Z'),
        resolutionType: 'LATE_PUNCH',
      });
      expect(log.resolutionType).toBe('LATE_PUNCH');

      log.markResolved('MANUAL_ADJUSTMENT');
      expect(log.resolutionType).toBe('MANUAL_ADJUSTMENT');
      expect(log.isResolved).toBe(true);
    });
  });
});
