import { describe, expect, it } from 'vitest';
import { UniqueEntityID } from '../domain/unique-entity-id';
import { PunchApproval } from './punch-approval';

describe('PunchApproval Entity', () => {
  it('deve criar uma aprovação com defaults (status PENDING, createdAt, sem resolver)', () => {
    const approval = PunchApproval.create({
      tenantId: new UniqueEntityID(),
      timeEntryId: new UniqueEntityID(),
      employeeId: new UniqueEntityID(),
      reason: 'OUT_OF_GEOFENCE',
    });

    expect(approval.status).toBe('PENDING');
    expect(approval.reason).toBe('OUT_OF_GEOFENCE');
    expect(approval.createdAt).toBeInstanceOf(Date);
    expect(approval.resolverUserId).toBeUndefined();
    expect(approval.resolvedAt).toBeUndefined();
    expect(approval.resolverNote).toBeUndefined();
    expect(approval.isPending).toBe(true);
    expect(approval.isResolved).toBe(false);
  });

  it('resolve(userId, note) define status APPROVED, resolverUserId, resolvedAt, resolverNote', () => {
    const approval = PunchApproval.create({
      tenantId: new UniqueEntityID(),
      timeEntryId: new UniqueEntityID(),
      employeeId: new UniqueEntityID(),
      reason: 'OUT_OF_GEOFENCE',
    });

    approval.resolve('user-01', 'aprovado manualmente');

    expect(approval.status).toBe('APPROVED');
    expect(approval.resolverUserId?.toString()).toBe('user-01');
    expect(approval.resolvedAt).toBeInstanceOf(Date);
    expect(approval.resolverNote).toBe('aprovado manualmente');
    expect(approval.isResolved).toBe(true);
    expect(approval.isPending).toBe(false);
    expect(approval.updatedAt).toBeInstanceOf(Date);
  });

  it('reject(userId, note) define status REJECTED, resolverUserId, resolvedAt, resolverNote', () => {
    const approval = PunchApproval.create({
      tenantId: new UniqueEntityID(),
      timeEntryId: new UniqueEntityID(),
      employeeId: new UniqueEntityID(),
      reason: 'OUT_OF_GEOFENCE',
    });

    approval.reject('user-02', 'sem justificativa válida');

    expect(approval.status).toBe('REJECTED');
    expect(approval.resolverUserId?.toString()).toBe('user-02');
    expect(approval.resolvedAt).toBeInstanceOf(Date);
    expect(approval.resolverNote).toBe('sem justificativa válida');
    expect(approval.isResolved).toBe(true);
    expect(approval.isPending).toBe(false);
  });

  it('resolve() duas vezes lança erro preservando audit trail (Portaria 671)', () => {
    const approval = PunchApproval.create({
      tenantId: new UniqueEntityID(),
      timeEntryId: new UniqueEntityID(),
      employeeId: new UniqueEntityID(),
      reason: 'OUT_OF_GEOFENCE',
    });

    approval.resolve('user-01', 'primeira decisão');
    expect(() => approval.resolve('user-02', 'segunda decisão')).toThrow(
      /já resolvida/,
    );
  });

  it('reject() após resolve() lança erro (double-resolve proteção bidirecional)', () => {
    const approval = PunchApproval.create({
      tenantId: new UniqueEntityID(),
      timeEntryId: new UniqueEntityID(),
      employeeId: new UniqueEntityID(),
      reason: 'OUT_OF_GEOFENCE',
    });

    approval.resolve('user-01');
    expect(() => approval.reject('user-02', 'mudando de ideia')).toThrow(
      /já resolvida/,
    );
  });

  it('resolve() sem note deixa resolverNote undefined', () => {
    const approval = PunchApproval.create({
      tenantId: new UniqueEntityID(),
      timeEntryId: new UniqueEntityID(),
      employeeId: new UniqueEntityID(),
      reason: 'OUT_OF_GEOFENCE',
    });

    approval.resolve('user-99');

    expect(approval.status).toBe('APPROVED');
    expect(approval.resolverUserId?.toString()).toBe('user-99');
    expect(approval.resolverNote).toBeUndefined();
  });

  it('isPending retorna true somente quando status === PENDING', () => {
    const approval = PunchApproval.create({
      tenantId: new UniqueEntityID(),
      timeEntryId: new UniqueEntityID(),
      employeeId: new UniqueEntityID(),
      reason: 'OUT_OF_GEOFENCE',
    });

    expect(approval.isPending).toBe(true);
    approval.resolve('user-01');
    expect(approval.isPending).toBe(false);
  });

  it('isResolved retorna true quando status !== PENDING', () => {
    const approvalA = PunchApproval.create({
      tenantId: new UniqueEntityID(),
      timeEntryId: new UniqueEntityID(),
      employeeId: new UniqueEntityID(),
      reason: 'OUT_OF_GEOFENCE',
    });
    const approvalB = PunchApproval.create({
      tenantId: new UniqueEntityID(),
      timeEntryId: new UniqueEntityID(),
      employeeId: new UniqueEntityID(),
      reason: 'OUT_OF_GEOFENCE',
    });

    approvalA.resolve('u1');
    approvalB.reject('u2');

    expect(approvalA.isResolved).toBe(true);
    expect(approvalB.isResolved).toBe(true);
  });

  it('details field é preservado através do lifecycle', () => {
    const details = { distance: 350, zoneId: 'zone-1', accuracy: 15 };
    const approval = PunchApproval.create({
      tenantId: new UniqueEntityID(),
      timeEntryId: new UniqueEntityID(),
      employeeId: new UniqueEntityID(),
      reason: 'OUT_OF_GEOFENCE',
      details,
    });

    expect(approval.details).toEqual(details);

    approval.resolve('user-01', 'verificado por GPS alternativo');

    // details continua intacto após resolve
    expect(approval.details).toEqual(details);
  });

  it('permite fornecer status e resolverUserId iniciais (hydration do banco)', () => {
    const tenantId = new UniqueEntityID();
    const resolverId = new UniqueEntityID('user-prev');
    const resolvedAt = new Date('2026-04-10T10:00:00Z');

    const approval = PunchApproval.create({
      tenantId,
      timeEntryId: new UniqueEntityID(),
      employeeId: new UniqueEntityID(),
      reason: 'OUT_OF_GEOFENCE',
      status: 'APPROVED',
      resolverUserId: resolverId,
      resolvedAt,
      resolverNote: 'resolvido anteriormente',
    });

    expect(approval.status).toBe('APPROVED');
    expect(approval.isResolved).toBe(true);
    expect(approval.resolverUserId?.toString()).toBe('user-prev');
    expect(approval.resolvedAt).toEqual(resolvedAt);
    expect(approval.resolverNote).toBe('resolvido anteriormente');
  });

  it('aceita id customizado no create', () => {
    const customId = new UniqueEntityID('abc-123');
    const approval = PunchApproval.create({
      id: customId,
      tenantId: new UniqueEntityID(),
      timeEntryId: new UniqueEntityID(),
      employeeId: new UniqueEntityID(),
      reason: 'OUT_OF_GEOFENCE',
    });

    expect(approval.id.toString()).toBe('abc-123');
  });
});
