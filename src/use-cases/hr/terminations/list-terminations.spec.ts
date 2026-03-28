import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import {
  NoticeType,
  Termination,
  TerminationStatus,
  TerminationType,
} from '@/entities/hr/termination';
import { InMemoryTerminationsRepository } from '@/repositories/hr/in-memory/in-memory-terminations-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ListTerminationsUseCase } from './list-terminations';

let terminationsRepository: InMemoryTerminationsRepository;
let sut: ListTerminationsUseCase;

const tenantId = new UniqueEntityID().toString();
const employeeIdA = new UniqueEntityID();
const employeeIdB = new UniqueEntityID();

function createTermination(overrides: {
  employeeId?: UniqueEntityID;
  type?: TerminationType;
  status?: TerminationStatus;
  terminationDate?: Date;
}): Termination {
  return Termination.create({
    tenantId: new UniqueEntityID(tenantId),
    employeeId: overrides.employeeId ?? employeeIdA,
    type: overrides.type ?? TerminationType.SEM_JUSTA_CAUSA,
    terminationDate: overrides.terminationDate ?? new Date('2025-03-15'),
    lastWorkDay: overrides.terminationDate ?? new Date('2025-03-15'),
    noticeType: NoticeType.INDENIZADO,
    noticeDays: 30,
    paymentDeadline: new Date('2025-03-25'),
    status: overrides.status,
  });
}

describe('List Terminations Use Case', () => {
  beforeEach(() => {
    terminationsRepository = new InMemoryTerminationsRepository();
    sut = new ListTerminationsUseCase(terminationsRepository);
  });

  it('should list all terminations for a tenant', async () => {
    terminationsRepository.items.push(
      createTermination({ employeeId: employeeIdA }),
      createTermination({ employeeId: employeeIdB }),
    );

    const { terminations, total } = await sut.execute({ tenantId });

    expect(terminations).toHaveLength(2);
    expect(total).toBe(2);
  });

  it('should return empty list when no terminations exist', async () => {
    const { terminations, total } = await sut.execute({ tenantId });

    expect(terminations).toHaveLength(0);
    expect(total).toBe(0);
  });

  it('should filter by employeeId', async () => {
    terminationsRepository.items.push(
      createTermination({ employeeId: employeeIdA }),
      createTermination({ employeeId: employeeIdB }),
    );

    const { terminations, total } = await sut.execute({
      tenantId,
      employeeId: employeeIdA.toString(),
    });

    expect(terminations).toHaveLength(1);
    expect(total).toBe(1);
    expect(terminations[0].employeeId.equals(employeeIdA)).toBe(true);
  });

  it('should filter by status', async () => {
    const pendingTermination = createTermination({});
    const calculatedTermination = createTermination({
      employeeId: employeeIdB,
      status: TerminationStatus.CALCULATED,
    });

    terminationsRepository.items.push(
      pendingTermination,
      calculatedTermination,
    );

    const { terminations, total } = await sut.execute({
      tenantId,
      status: TerminationStatus.CALCULATED,
    });

    expect(terminations).toHaveLength(1);
    expect(total).toBe(1);
    expect(terminations[0].status).toBe(TerminationStatus.CALCULATED);
  });

  it('should filter by type', async () => {
    terminationsRepository.items.push(
      createTermination({ type: TerminationType.SEM_JUSTA_CAUSA }),
      createTermination({
        employeeId: employeeIdB,
        type: TerminationType.JUSTA_CAUSA,
      }),
    );

    const { terminations, total } = await sut.execute({
      tenantId,
      type: TerminationType.JUSTA_CAUSA,
    });

    expect(terminations).toHaveLength(1);
    expect(total).toBe(1);
    expect(terminations[0].type).toBe(TerminationType.JUSTA_CAUSA);
  });

  it('should filter by date range', async () => {
    terminationsRepository.items.push(
      createTermination({ terminationDate: new Date('2025-01-10') }),
      createTermination({
        employeeId: employeeIdB,
        terminationDate: new Date('2025-03-20'),
      }),
    );

    const { terminations, total } = await sut.execute({
      tenantId,
      startDate: new Date('2025-03-01'),
      endDate: new Date('2025-03-31'),
    });

    expect(terminations).toHaveLength(1);
    expect(total).toBe(1);
  });

  it('should paginate results', async () => {
    for (let i = 0; i < 5; i++) {
      terminationsRepository.items.push(
        createTermination({
          employeeId: new UniqueEntityID(),
          terminationDate: new Date(
            `2025-03-${String(10 + i).padStart(2, '0')}`,
          ),
        }),
      );
    }

    const page1 = await sut.execute({ tenantId, page: 1, perPage: 2 });
    expect(page1.terminations).toHaveLength(2);
    expect(page1.total).toBe(5);

    const page2 = await sut.execute({ tenantId, page: 2, perPage: 2 });
    expect(page2.terminations).toHaveLength(2);

    const page3 = await sut.execute({ tenantId, page: 3, perPage: 2 });
    expect(page3.terminations).toHaveLength(1);
  });

  it('should not return terminations from other tenants', async () => {
    const otherTenantId = new UniqueEntityID().toString();

    terminationsRepository.items.push(createTermination({}));
    terminationsRepository.items.push(
      Termination.create({
        tenantId: new UniqueEntityID(otherTenantId),
        employeeId: employeeIdB,
        type: TerminationType.SEM_JUSTA_CAUSA,
        terminationDate: new Date('2025-03-15'),
        lastWorkDay: new Date('2025-03-15'),
        noticeType: NoticeType.INDENIZADO,
        noticeDays: 30,
        paymentDeadline: new Date('2025-03-25'),
      }),
    );

    const { terminations, total } = await sut.execute({ tenantId });

    expect(terminations).toHaveLength(1);
    expect(total).toBe(1);
  });
});
