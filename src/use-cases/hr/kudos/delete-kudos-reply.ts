import { ForbiddenError } from '@/@errors/use-cases/forbidden-error';
import { KudosReplyNotFoundError } from '@/@errors/use-cases/kudos-reply-not-found-error';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { KudosRepliesRepository } from '@/repositories/hr/kudos-replies-repository';

export interface DeleteKudosReplyInput {
  tenantId: string;
  replyId: string;
  requesterEmployeeId: string;
  /**
   * Whether the requester has the `hr.kudos.admin` permission. Admins can
   * remove any reply regardless of authorship.
   */
  requesterIsKudosAdmin: boolean;
}

export interface DeleteKudosReplyOutput {
  replyId: string;
}

export class DeleteKudosReplyUseCase {
  constructor(
    private readonly kudosRepliesRepository: KudosRepliesRepository,
  ) {}

  async execute(input: DeleteKudosReplyInput): Promise<DeleteKudosReplyOutput> {
    const reply = await this.kudosRepliesRepository.findById(
      new UniqueEntityID(input.replyId),
    );

    if (!reply || reply.isDeleted()) {
      throw new KudosReplyNotFoundError();
    }

    if (reply.tenantId.toString() !== input.tenantId) {
      throw new KudosReplyNotFoundError();
    }

    const isAuthor = reply.isAuthoredBy(
      new UniqueEntityID(input.requesterEmployeeId),
    );

    if (!isAuthor && !input.requesterIsKudosAdmin) {
      throw new ForbiddenError(
        'Only the author or a kudos admin can remove this reply',
      );
    }

    reply.softDelete();

    await this.kudosRepliesRepository.save(reply);

    return { replyId: reply.id.toString() };
  }
}
