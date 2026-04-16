import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ForbiddenError } from '@/@errors/use-cases/forbidden-error';
import { KudosReplyNotFoundError } from '@/@errors/use-cases/kudos-reply-not-found-error';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { KudosReply } from '@/entities/hr/kudos-reply';
import type { KudosRepliesRepository } from '@/repositories/hr/kudos-replies-repository';

export interface UpdateKudosReplyInput {
  tenantId: string;
  replyId: string;
  requesterEmployeeId: string;
  content: string;
}

export interface UpdateKudosReplyOutput {
  reply: KudosReply;
}

export class UpdateKudosReplyUseCase {
  constructor(
    private readonly kudosRepliesRepository: KudosRepliesRepository,
  ) {}

  async execute(
    input: UpdateKudosReplyInput,
  ): Promise<UpdateKudosReplyOutput> {
    const trimmedContent = input.content.trim();

    if (!trimmedContent) {
      throw new BadRequestError('Reply content is required');
    }

    const reply = await this.kudosRepliesRepository.findById(
      new UniqueEntityID(input.replyId),
    );

    if (!reply || reply.isDeleted()) {
      throw new KudosReplyNotFoundError();
    }

    if (reply.tenantId.toString() !== input.tenantId) {
      throw new KudosReplyNotFoundError();
    }

    if (
      !reply.isAuthoredBy(new UniqueEntityID(input.requesterEmployeeId))
    ) {
      throw new ForbiddenError(
        'Only the author can edit this reply',
      );
    }

    reply.content = trimmedContent;

    await this.kudosRepliesRepository.save(reply);

    return { reply };
  }
}
