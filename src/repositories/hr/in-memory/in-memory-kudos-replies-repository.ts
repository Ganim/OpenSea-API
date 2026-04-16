import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { KudosReply } from '@/entities/hr/kudos-reply';
import type { KudosRepliesRepository } from '../kudos-replies-repository';

export class InMemoryKudosRepliesRepository implements KudosRepliesRepository {
  public items: KudosReply[] = [];

  async create(reply: KudosReply): Promise<void> {
    this.items.push(reply);
  }

  async save(reply: KudosReply): Promise<void> {
    const index = this.items.findIndex((item) => item.id.equals(reply.id));
    if (index >= 0) {
      this.items[index] = reply;
    }
  }

  async findById(replyId: UniqueEntityID): Promise<KudosReply | null> {
    const found = this.items.find((item) => item.id.equals(replyId));
    return found ?? null;
  }

  async findManyByKudosId(kudosId: UniqueEntityID): Promise<KudosReply[]> {
    return this.items
      .filter((item) => item.kudosId.equals(kudosId) && !item.isDeleted())
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  async countActiveForKudosIds(
    kudosIds: string[],
  ): Promise<Record<string, number>> {
    const counts: Record<string, number> = {};

    for (const kudosId of kudosIds) {
      counts[kudosId] = this.items.filter(
        (item) => item.kudosId.toString() === kudosId && !item.isDeleted(),
      ).length;
    }

    return counts;
  }
}
