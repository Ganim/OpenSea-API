import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import {
  NoticeType,
  Termination,
  TerminationStatus,
  TerminationType,
} from '@/entities/hr/termination';
import { InMemoryTerminationsRepository } from '@/repositories/hr/in-memory/in-memory-terminations-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { UpdateTerminationUseCase } from './update-termination';

let terminationsRepository: InMemoryTerminationsRepository;
let sut: UpdateTerminationUseCase;

const tenantId = new UniqueEntityID().toString();

function createTerminationWithStatus(status?: TerminationStatus): Termination {
  return Termination.create({
    tenantId: new UniqueEntityID(tenantId),
    employeeId: new UniqueEntityID(),
    type: TerminationType.SEM_JUSTA_CAUSA,
    terminationDate: new Date('2025-03-15'),
    lastWorkDay: new Date('2025-03-15'),
    noticeType: NoticeType.INDENIZADO,
    noticeDays: 30,
    paymentDeadline: new Date('2025-03-25'),
    status,
  });
}

describe('Update Termination Use Case', () => {
  beforeEach(() => {
    terminationsRepository = new InMemoryTerminationsRepository();
    sut = new UpdateTerminationUseCase(terminationsRepository);
  });

  it('should update notes on a pending termination', async () => {
    const pendingTermination = createTerminationWithStatus();
    terminationsRepository.items.push(pendingTermination);

    const { termination } = await sut.execute({
      tenantId,
      terminationId: pendingTermination.id.toString(),
      notes: 'Updated notes for this termination',
    });

    expect(termination.notes).toBe('Updated notes for this termination');
  });

  it('should update notes on a calculated termination', async () => {
    const calculatedTermination = createTerminationWithStatus(
      TerminationStatus.CALCULATED,
    );
    terminationsRepository.items.push(calculatedTermination);

    const { termination } = await sut.execute({
      tenantId,
      terminationId: calculatedTermination.id.toString(),
      notes: 'Post-calculation notes',
    });

    expect(termination.notes).toBe('Post-calculation notes');
  });

  it('should mark a CALCULATED termination as paid', async () => {
    const calculatedTermination = createTerminationWithStatus(
      TerminationStatus.CALCULATED,
    );
    terminationsRepository.items.push(calculatedTermination);

    const { termination } = await sut.execute({
      tenantId,
      terminationId: calculatedTermination.id.toString(),
      markAsPaid: true,
    });

    expect(termination.status).toBe(TerminationStatus.PAID);
    expect(termination.paidAt).toBeDefined();
  });

  it('should throw when marking a PENDING termination as paid', async () => {
    const pendingTermination = createTerminationWithStatus();
    terminationsRepository.items.push(pendingTermination);

    await expect(
      sut.execute({
        tenantId,
        terminationId: pendingTermination.id.toString(),
        markAsPaid: true,
      }),
    ).rejects.toThrow(
      'Somente rescisões calculadas podem ser marcadas como pagas',
    );
  });

  it('should throw when marking a PAID termination as paid again', async () => {
    const paidTermination = createTerminationWithStatus(TerminationStatus.PAID);
    terminationsRepository.items.push(paidTermination);

    await expect(
      sut.execute({
        tenantId,
        terminationId: paidTermination.id.toString(),
        markAsPaid: true,
      }),
    ).rejects.toThrow(
      'Somente rescisões calculadas podem ser marcadas como pagas',
    );
  });

  it('should throw if termination not found', async () => {
    await expect(
      sut.execute({
        tenantId,
        terminationId: new UniqueEntityID().toString(),
        notes: 'Some notes',
      }),
    ).rejects.toThrow('Rescisão não encontrada');
  });

  it('should mark as paid and update notes simultaneously', async () => {
    const calculatedTermination = createTerminationWithStatus(
      TerminationStatus.CALCULATED,
    );
    terminationsRepository.items.push(calculatedTermination);

    const { termination } = await sut.execute({
      tenantId,
      terminationId: calculatedTermination.id.toString(),
      markAsPaid: true,
      notes: 'Payment processed via bank transfer',
    });

    expect(termination.status).toBe(TerminationStatus.PAID);
    expect(termination.notes).toBe('Payment processed via bank transfer');
  });
});
