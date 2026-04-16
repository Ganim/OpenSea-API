import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { KudosReaction } from '@/entities/hr/kudos-reaction';
import type {
  KudosReactionSummaryItem,
  KudosReactionsRepository,
} from '../kudos-reactions-repository';

const MAX_EMPLOYEES_PER_EMOJI_PREVIEW = 5;

export class InMemoryKudosReactionsRepository
  implements KudosReactionsRepository
{
  public items: KudosReaction[] = [];

  async create(reaction: KudosReaction): Promise<void> {
    this.items.push(reaction);
  }

  async delete(reactionId: UniqueEntityID): Promise<void> {
    this.items = this.items.filter((item) => !item.id.equals(reactionId));
  }

  async findByKudosEmployeeEmoji(
    kudosId: UniqueEntityID,
    employeeId: UniqueEntityID,
    emoji: string,
  ): Promise<KudosReaction | null> {
    const found = this.items.find(
      (item) =>
        item.kudosId.equals(kudosId) &&
        item.employeeId.equals(employeeId) &&
        item.emoji === emoji,
    );

    return found ?? null;
  }

  async findManyByKudosId(kudosId: UniqueEntityID): Promise<KudosReaction[]> {
    return this.items
      .filter((item) => item.kudosId.equals(kudosId))
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  async summarizeForKudosIds(
    kudosIds: string[],
  ): Promise<Record<string, KudosReactionSummaryItem[]>> {
    const summary: Record<string, KudosReactionSummaryItem[]> = {};

    for (const kudosId of kudosIds) {
      const reactions = this.items.filter(
        (item) => item.kudosId.toString() === kudosId,
      );

      const grouped = new Map<string, string[]>();
      for (const reaction of reactions) {
        const employees = grouped.get(reaction.emoji) ?? [];
        employees.push(reaction.employeeId.toString());
        grouped.set(reaction.emoji, employees);
      }

      summary[kudosId] = Array.from(grouped.entries())
        .map(([emoji, employeeIds]) => ({
          emoji,
          count: employeeIds.length,
          employeeIds: employeeIds.slice(0, MAX_EMPLOYEES_PER_EMOJI_PREVIEW),
        }))
        .sort((a, b) => b.count - a.count);
    }

    return summary;
  }
}
