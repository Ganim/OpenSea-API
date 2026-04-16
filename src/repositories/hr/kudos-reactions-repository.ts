import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { KudosReaction } from '@/entities/hr/kudos-reaction';

export interface KudosReactionSummaryItem {
  emoji: string;
  count: number;
  employeeIds: string[];
}

export interface KudosReactionsRepository {
  create(reaction: KudosReaction): Promise<void>;
  delete(reactionId: UniqueEntityID): Promise<void>;
  findByKudosEmployeeEmoji(
    kudosId: UniqueEntityID,
    employeeId: UniqueEntityID,
    emoji: string,
  ): Promise<KudosReaction | null>;
  findManyByKudosId(kudosId: UniqueEntityID): Promise<KudosReaction[]>;
  /**
   * Returns aggregated reaction summaries (emoji + count + sample employees)
   * for many kudos in a single round trip. Used by the list endpoint to
   * enrich each item with its top reactions.
   */
  summarizeForKudosIds(
    kudosIds: string[],
  ): Promise<Record<string, KudosReactionSummaryItem[]>>;
}
