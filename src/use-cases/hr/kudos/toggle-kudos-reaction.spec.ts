import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { KudosNotFoundError } from '@/@errors/use-cases/kudos-not-found-error';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { EmployeeKudos } from '@/entities/hr/employee-kudos';
import { InMemoryEmployeeKudosRepository } from '@/repositories/hr/in-memory/in-memory-employee-kudos-repository';
import { InMemoryKudosReactionsRepository } from '@/repositories/hr/in-memory/in-memory-kudos-reactions-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ToggleKudosReactionUseCase } from './toggle-kudos-reaction';

let employeeKudosRepository: InMemoryEmployeeKudosRepository;
let kudosReactionsRepository: InMemoryKudosReactionsRepository;
let toggleKudosReactionUseCase: ToggleKudosReactionUseCase;

const TENANT_ID = new UniqueEntityID().toString();
const EMPLOYEE_ID = new UniqueEntityID().toString();

function createKudos() {
  return EmployeeKudos.create({
    tenantId: new UniqueEntityID(TENANT_ID),
    fromEmployeeId: new UniqueEntityID(),
    toEmployeeId: new UniqueEntityID(),
    message: 'Great job!',
    category: 'EXCELLENCE',
    isPublic: true,
  });
}

describe('ToggleKudosReactionUseCase', () => {
  beforeEach(() => {
    employeeKudosRepository = new InMemoryEmployeeKudosRepository();
    kudosReactionsRepository = new InMemoryKudosReactionsRepository();
    toggleKudosReactionUseCase = new ToggleKudosReactionUseCase(
      employeeKudosRepository,
      kudosReactionsRepository,
    );
  });

  it('should add a reaction when none exists', async () => {
    const kudos = createKudos();
    await employeeKudosRepository.create(kudos);

    const { action, reaction } = await toggleKudosReactionUseCase.execute({
      tenantId: TENANT_ID,
      kudosId: kudos.id.toString(),
      employeeId: EMPLOYEE_ID,
      emoji: '👏',
    });

    expect(action).toBe('added');
    expect(reaction).not.toBeNull();
    expect(kudosReactionsRepository.items).toHaveLength(1);
    expect(reaction?.emoji).toBe('👏');
  });

  it('should remove the reaction when toggling the same emoji again', async () => {
    const kudos = createKudos();
    await employeeKudosRepository.create(kudos);

    await toggleKudosReactionUseCase.execute({
      tenantId: TENANT_ID,
      kudosId: kudos.id.toString(),
      employeeId: EMPLOYEE_ID,
      emoji: '👏',
    });

    const { action, reaction } = await toggleKudosReactionUseCase.execute({
      tenantId: TENANT_ID,
      kudosId: kudos.id.toString(),
      employeeId: EMPLOYEE_ID,
      emoji: '👏',
    });

    expect(action).toBe('removed');
    expect(reaction).toBeNull();
    expect(kudosReactionsRepository.items).toHaveLength(0);
  });

  it('should allow distinct emojis from the same employee', async () => {
    const kudos = createKudos();
    await employeeKudosRepository.create(kudos);

    await toggleKudosReactionUseCase.execute({
      tenantId: TENANT_ID,
      kudosId: kudos.id.toString(),
      employeeId: EMPLOYEE_ID,
      emoji: '👏',
    });

    await toggleKudosReactionUseCase.execute({
      tenantId: TENANT_ID,
      kudosId: kudos.id.toString(),
      employeeId: EMPLOYEE_ID,
      emoji: '🎉',
    });

    expect(kudosReactionsRepository.items).toHaveLength(2);
  });

  it('should throw KudosNotFoundError when kudos does not exist', async () => {
    await expect(
      toggleKudosReactionUseCase.execute({
        tenantId: TENANT_ID,
        kudosId: new UniqueEntityID().toString(),
        employeeId: EMPLOYEE_ID,
        emoji: '👏',
      }),
    ).rejects.toBeInstanceOf(KudosNotFoundError);
  });

  it('should throw BadRequestError on empty emoji', async () => {
    const kudos = createKudos();
    await employeeKudosRepository.create(kudos);

    await expect(
      toggleKudosReactionUseCase.execute({
        tenantId: TENANT_ID,
        kudosId: kudos.id.toString(),
        employeeId: EMPLOYEE_ID,
        emoji: '   ',
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should reject emojis longer than 16 characters', async () => {
    const kudos = createKudos();
    await employeeKudosRepository.create(kudos);

    await expect(
      toggleKudosReactionUseCase.execute({
        tenantId: TENANT_ID,
        kudosId: kudos.id.toString(),
        employeeId: EMPLOYEE_ID,
        emoji: 'a'.repeat(20),
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });
});
