import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import {
  NoticeType,
  Termination,
  TerminationType,
} from '@/entities/hr/termination';
import { InMemoryTerminationsRepository } from '@/repositories/hr/in-memory/in-memory-terminations-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { GetTerminationUseCase } from './get-termination';

let terminationsRepository: InMemoryTerminationsRepository;
let sut: GetTerminationUseCase;
let existingTermination: Termination;

const tenantId = new UniqueEntityID().toString();

describe('Get Termination Use Case', () => {
  beforeEach(() => {
    terminationsRepository = new InMemoryTerminationsRepository();
    sut = new GetTerminationUseCase(terminationsRepository);

    existingTermination = Termination.create({
      tenantId: new UniqueEntityID(tenantId),
      employeeId: new UniqueEntityID(),
      type: TerminationType.SEM_JUSTA_CAUSA,
      terminationDate: new Date('2025-03-15'),
      lastWorkDay: new Date('2025-03-15'),
      noticeType: NoticeType.INDENIZADO,
      noticeDays: 45,
      paymentDeadline: new Date('2025-03-25'),
      notes: 'Test termination',
    });

    terminationsRepository.items.push(existingTermination);
  });

  it('should get termination by id', async () => {
    const { termination } = await sut.execute({
      tenantId,
      terminationId: existingTermination.id.toString(),
    });

    expect(termination).toBeDefined();
    expect(termination.id.equals(existingTermination.id)).toBe(true);
    expect(termination.type).toBe(TerminationType.SEM_JUSTA_CAUSA);
    expect(termination.noticeDays).toBe(45);
    expect(termination.notes).toBe('Test termination');
  });

  it('should throw error if termination not found', async () => {
    await expect(
      sut.execute({
        tenantId,
        terminationId: new UniqueEntityID().toString(),
      }),
    ).rejects.toThrow('Rescisão não encontrada');
  });

  it('should not return termination from another tenant', async () => {
    const otherTenantId = new UniqueEntityID().toString();

    await expect(
      sut.execute({
        tenantId: otherTenantId,
        terminationId: existingTermination.id.toString(),
      }),
    ).rejects.toThrow('Rescisão não encontrada');
  });
});
