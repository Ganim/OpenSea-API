import { ForbiddenError } from '@/@errors/use-cases/forbidden-error';
import { KudosReplyNotFoundError } from '@/@errors/use-cases/kudos-reply-not-found-error';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { KudosReply } from '@/entities/hr/kudos-reply';
import { InMemoryKudosRepliesRepository } from '@/repositories/hr/in-memory/in-memory-kudos-replies-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { DeleteKudosReplyUseCase } from './delete-kudos-reply';

let kudosRepliesRepository: InMemoryKudosRepliesRepository;
let deleteKudosReplyUseCase: DeleteKudosReplyUseCase;

const TENANT_ID = new UniqueEntityID().toString();
const AUTHOR_EMPLOYEE_ID = new UniqueEntityID().toString();

function createReply() {
  return KudosReply.create({
    tenantId: new UniqueEntityID(TENANT_ID),
    kudosId: new UniqueEntityID(),
    employeeId: new UniqueEntityID(AUTHOR_EMPLOYEE_ID),
    content: 'Original',
  });
}

describe('DeleteKudosReplyUseCase', () => {
  beforeEach(() => {
    kudosRepliesRepository = new InMemoryKudosRepliesRepository();
    deleteKudosReplyUseCase = new DeleteKudosReplyUseCase(
      kudosRepliesRepository,
    );
  });

  it('should soft-delete the reply when requester is the author', async () => {
    const reply = createReply();
    await kudosRepliesRepository.create(reply);

    const { replyId } = await deleteKudosReplyUseCase.execute({
      tenantId: TENANT_ID,
      replyId: reply.id.toString(),
      requesterEmployeeId: AUTHOR_EMPLOYEE_ID,
      requesterIsKudosAdmin: false,
    });

    expect(replyId).toBe(reply.id.toString());
    const stored = await kudosRepliesRepository.findById(reply.id);
    expect(stored?.isDeleted()).toBe(true);
  });

  it('should allow kudos admin to delete any reply', async () => {
    const reply = createReply();
    await kudosRepliesRepository.create(reply);

    await deleteKudosReplyUseCase.execute({
      tenantId: TENANT_ID,
      replyId: reply.id.toString(),
      requesterEmployeeId: new UniqueEntityID().toString(),
      requesterIsKudosAdmin: true,
    });

    const stored = await kudosRepliesRepository.findById(reply.id);
    expect(stored?.isDeleted()).toBe(true);
  });

  it('should throw ForbiddenError when not author and not admin', async () => {
    const reply = createReply();
    await kudosRepliesRepository.create(reply);

    await expect(
      deleteKudosReplyUseCase.execute({
        tenantId: TENANT_ID,
        replyId: reply.id.toString(),
        requesterEmployeeId: new UniqueEntityID().toString(),
        requesterIsKudosAdmin: false,
      }),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('should throw KudosReplyNotFoundError when reply does not exist', async () => {
    await expect(
      deleteKudosReplyUseCase.execute({
        tenantId: TENANT_ID,
        replyId: new UniqueEntityID().toString(),
        requesterEmployeeId: AUTHOR_EMPLOYEE_ID,
        requesterIsKudosAdmin: false,
      }),
    ).rejects.toBeInstanceOf(KudosReplyNotFoundError);
  });
});
