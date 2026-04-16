import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ForbiddenError } from '@/@errors/use-cases/forbidden-error';
import { KudosReplyNotFoundError } from '@/@errors/use-cases/kudos-reply-not-found-error';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { KudosReply } from '@/entities/hr/kudos-reply';
import { InMemoryKudosRepliesRepository } from '@/repositories/hr/in-memory/in-memory-kudos-replies-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { UpdateKudosReplyUseCase } from './update-kudos-reply';

let kudosRepliesRepository: InMemoryKudosRepliesRepository;
let updateKudosReplyUseCase: UpdateKudosReplyUseCase;

const TENANT_ID = new UniqueEntityID().toString();
const AUTHOR_EMPLOYEE_ID = new UniqueEntityID().toString();

function createReply(overrides: { authorId?: string; tenantId?: string } = {}) {
  return KudosReply.create({
    tenantId: new UniqueEntityID(overrides.tenantId ?? TENANT_ID),
    kudosId: new UniqueEntityID(),
    employeeId: new UniqueEntityID(overrides.authorId ?? AUTHOR_EMPLOYEE_ID),
    content: 'Original',
  });
}

describe('UpdateKudosReplyUseCase', () => {
  beforeEach(() => {
    kudosRepliesRepository = new InMemoryKudosRepliesRepository();
    updateKudosReplyUseCase = new UpdateKudosReplyUseCase(
      kudosRepliesRepository,
    );
  });

  it('should update the reply when requester is the author', async () => {
    const reply = createReply();
    await kudosRepliesRepository.create(reply);

    const { reply: updated } = await updateKudosReplyUseCase.execute({
      tenantId: TENANT_ID,
      replyId: reply.id.toString(),
      requesterEmployeeId: AUTHOR_EMPLOYEE_ID,
      content: 'Edited content',
    });

    expect(updated.content).toBe('Edited content');
  });

  it('should reject empty content', async () => {
    const reply = createReply();
    await kudosRepliesRepository.create(reply);

    await expect(
      updateKudosReplyUseCase.execute({
        tenantId: TENANT_ID,
        replyId: reply.id.toString(),
        requesterEmployeeId: AUTHOR_EMPLOYEE_ID,
        content: '   ',
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should throw ForbiddenError when requester is not the author', async () => {
    const reply = createReply();
    await kudosRepliesRepository.create(reply);

    await expect(
      updateKudosReplyUseCase.execute({
        tenantId: TENANT_ID,
        replyId: reply.id.toString(),
        requesterEmployeeId: new UniqueEntityID().toString(),
        content: 'Hi',
      }),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('should throw KudosReplyNotFoundError when reply does not exist', async () => {
    await expect(
      updateKudosReplyUseCase.execute({
        tenantId: TENANT_ID,
        replyId: new UniqueEntityID().toString(),
        requesterEmployeeId: AUTHOR_EMPLOYEE_ID,
        content: 'Hi',
      }),
    ).rejects.toBeInstanceOf(KudosReplyNotFoundError);
  });

  it('should hide replies from other tenants behind not-found', async () => {
    const reply = createReply({
      tenantId: new UniqueEntityID().toString(),
    });
    await kudosRepliesRepository.create(reply);

    await expect(
      updateKudosReplyUseCase.execute({
        tenantId: TENANT_ID,
        replyId: reply.id.toString(),
        requesterEmployeeId: AUTHOR_EMPLOYEE_ID,
        content: 'Hi',
      }),
    ).rejects.toBeInstanceOf(KudosReplyNotFoundError);
  });

  it('should not update soft-deleted replies', async () => {
    const reply = createReply();
    reply.softDelete();
    await kudosRepliesRepository.create(reply);

    await expect(
      updateKudosReplyUseCase.execute({
        tenantId: TENANT_ID,
        replyId: reply.id.toString(),
        requesterEmployeeId: AUTHOR_EMPLOYEE_ID,
        content: 'Hi',
      }),
    ).rejects.toBeInstanceOf(KudosReplyNotFoundError);
  });
});
