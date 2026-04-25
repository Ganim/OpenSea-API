import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryEmployeesRepository } from '@/repositories/hr/in-memory/in-memory-employees-repository';
import { makeEmployee } from '@/utils/tests/factories/hr/make-employee';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Hoisted mock so the use-case picks it up via the named import. Default
// implementation produces a deterministic 6-char id ("BBBBBB") that we override
// per-test via `mockImplementation` / `mockReturnValueOnce`.
const generateShortIdMock = vi.hoisted(() => vi.fn(() => 'BBBBBB'));

vi.mock('@/lib/short-id/generate-short-id', () => ({
  generateShortId: generateShortIdMock,
}));

import { RegenerateShortIdUseCase } from './regenerate-short-id';

let employeesRepository: InMemoryEmployeesRepository;
let sut: RegenerateShortIdUseCase;
const tenantId = new UniqueEntityID().toString();

describe('Regenerate Employee Short ID Use Case', () => {
  beforeEach(() => {
    employeesRepository = new InMemoryEmployeesRepository();
    sut = new RegenerateShortIdUseCase(employeesRepository);
    generateShortIdMock.mockReset();
    generateShortIdMock.mockImplementation(() => 'BBBBBB');
  });

  it('gera um novo shortId de 6 caracteres diferente do anterior', async () => {
    // Use the real generator so we exercise the actual alphabet/length contract.
    const { generateShortId: realGenerate } = await vi.importActual<
      typeof import('@/lib/short-id/generate-short-id')
    >('@/lib/short-id/generate-short-id');
    generateShortIdMock.mockImplementation(() => realGenerate());

    const previousShortId = 'AAAAAA';
    const employee = makeEmployee({
      tenantId: new UniqueEntityID(tenantId),
      shortId: previousShortId,
    });
    employeesRepository.items.push(employee);

    const result = await sut.execute({
      tenantId,
      employeeId: employee.id.toString(),
    });

    expect(result.employee.shortId).toBeDefined();
    expect(result.employee.shortId).not.toBeNull();
    expect(result.employee.shortId).toHaveLength(6);
    expect(result.employee.shortId).not.toBe(previousShortId);

    // Persisted in the repository
    const persisted = await employeesRepository.findById(employee.id, tenantId);
    expect(persisted?.shortId).toBe(result.employee.shortId);
  });

  it('lança ResourceNotFoundError quando o funcionário não existe', async () => {
    const missingEmployeeId = new UniqueEntityID().toString();

    await expect(
      sut.execute({
        tenantId,
        employeeId: missingEmployeeId,
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('faz retry quando há colisão de shortId', async () => {
    const targetEmployee = makeEmployee({
      tenantId: new UniqueEntityID(tenantId),
      shortId: 'OLDOLD',
    });
    const collidingEmployee = makeEmployee({
      tenantId: new UniqueEntityID(tenantId),
      shortId: 'TAKEN1',
    });
    employeesRepository.items.push(targetEmployee, collidingEmployee);

    // First attempt collides with `collidingEmployee`, second resolves.
    generateShortIdMock
      .mockReturnValueOnce('TAKEN1')
      .mockReturnValueOnce('FRESH2');

    const result = await sut.execute({
      tenantId,
      employeeId: targetEmployee.id.toString(),
    });

    expect(result.employee.shortId).toBe('FRESH2');
    expect(generateShortIdMock).toHaveBeenCalledTimes(2);
  });

  it('falha após 10 tentativas de colisão de shortId', async () => {
    const targetEmployee = makeEmployee({
      tenantId: new UniqueEntityID(tenantId),
      shortId: 'OLDOLD',
    });
    const collidingEmployee = makeEmployee({
      tenantId: new UniqueEntityID(tenantId),
      shortId: 'TAKEN1',
    });
    employeesRepository.items.push(targetEmployee, collidingEmployee);

    generateShortIdMock.mockReturnValue('TAKEN1');

    await expect(
      sut.execute({
        tenantId,
        employeeId: targetEmployee.id.toString(),
      }),
    ).rejects.toThrow(/shortId/);

    expect(generateShortIdMock).toHaveBeenCalledTimes(10);
  });
});
