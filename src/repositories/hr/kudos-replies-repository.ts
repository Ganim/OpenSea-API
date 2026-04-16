import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { KudosReply } from '@/entities/hr/kudos-reply';

export interface KudosRepliesRepository {
  create(reply: KudosReply): Promise<void>;
  save(reply: KudosReply): Promise<void>;
  findById(replyId: UniqueEntityID): Promise<KudosReply | null>;
  findManyByKudosId(kudosId: UniqueEntityID): Promise<KudosReply[]>;
  /**
   * Returns the active (non-deleted) reply count for many kudos in one query.
   * Used by the list endpoint to render the "X replies" indicator.
   */
  countActiveForKudosIds(
    kudosIds: string[],
  ): Promise<Record<string, number>>;
}
