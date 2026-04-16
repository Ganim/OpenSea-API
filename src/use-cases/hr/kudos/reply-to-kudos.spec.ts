import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { KudosNotFoundError } from '@/@errors/use-cases/kudos-not-found-error';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { EmployeeKudos } from '@/entities/hr/employee-kudos';
import { InMemoryEmployeeKudosRepository } from '@/repositories/hr/in-memory/in-memory-employee-kudos-repository';
import { InMemoryKudosRepliesRepository } from '@/repositories/hr/in-memory/in-memory-kudos-replies-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ReplyToKudosUseCase } from './reply-to-kudos';

let employeeKudosRepository: InMemoryEmployeeKudosRepository;
let kudosRepliesRepository: InMemoryKudosRepliesRepository;
let replyToKudosUseCase: ReplyToKudosUseCase;

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

describe('ReplyToKudosUseCase', () => {
  beforeEach(() => {
    employeeKudosRepository = new InMemoryEmployeeKudosRepository();
    kudosRepliesRepository = new InMemoryKudosRepliesRepository();
    replyToKudosUseCase = new ReplyToKudosUseCase(
      employeeKudosRepository,
      kudosRepliesRepository,
    );
  });

  it('should create a reply on a kudos', async () => {
    const kudos = createKudos();
    await employeeKudosRepository.create(kudos);

    const { reply } = await replyToKudosUseCase.execute({
      tenantId: TENANT_ID,
      kudosId: kudos.id.toString(),
      employeeId: EMPLOYEE_ID,
      content: 'Congrats!',
    });

    expect(reply.content).toBe('Congrats!');
    expect(kudosRepliesRepository.items).toHaveLength(1);
  });

  it('should trim the content', async () => {
    const kudos = createKudos();
    await employeeKudosRepository.create(kudos);

    const { reply } = await replyToKudosUseCase.execute({
      tenantId: TENANT_ID,
      kudosId: kudos.id.toString(),
      employeeId: EMPLOYEE_ID,
      content: '   Bem feito!   ',
    });

    expect(reply.content).toBe('Bem feito!');
  });

  it('should reject empty content', async () => {
    const kudos = createKudos();
    await employeeKudosRepository.create(kudos);

    await expect(
      replyToKudosUseCase.execute({
        tenantId: TENANT_ID,
        kudosId: kudos.id.toString(),
        employeeId: EMPLOYEE_ID,
        content: '   ',
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should throw KudosNotFoundError when kudos does not exist', async () => {
    await expect(
      replyToKudosUseCase.execute({
        tenantId: TENANT_ID,
        kudosId: new UniqueEntityID().toString(),
        employeeId: EMPLOYEE_ID,
        content: 'Nice work!',
      }),
    ).rejects.toBeInstanceOf(KudosNotFoundError);
  });
});
