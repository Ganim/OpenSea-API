import { randomUUID } from 'node:crypto';
import type {
  CardActivitiesRepository,
  CardActivityRecord,
  CreateCardActivitySchema,
  FindManyCardActivitiesOptions,
  FindManyCardActivitiesResult,
  FindManyBoardActivitiesOptions,
  FindManyBoardActivitiesResult,
} from '../card-activities-repository';

export class InMemoryCardActivitiesRepository
  implements CardActivitiesRepository
{
  public items: CardActivityRecord[] = [];

  async create(
    data: CreateCardActivitySchema,
  ): Promise<CardActivityRecord> {
    const activity: CardActivityRecord = {
      id: randomUUID(),
      cardId: data.cardId,
      boardId: data.boardId,
      userId: data.userId,
      type: data.type,
      description: data.description,
      field: data.field ?? null,
      oldValue: data.oldValue ?? null,
      newValue: data.newValue ?? null,
      metadata: data.metadata ?? null,
      createdAt: new Date(),
      userName: null,
    };

    this.items.push(activity);
    return activity;
  }

  async findByCardId(
    options: FindManyCardActivitiesOptions,
  ): Promise<FindManyCardActivitiesResult> {
    const filteredActivities = this.items.filter((activity) => {
      if (activity.cardId !== options.cardId) return false;
      if (options.type && activity.type !== options.type) return false;
      return true;
    });

    const sortedActivities = filteredActivities.sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    );
    const total = sortedActivities.length;
    const page = options.page ?? 1;
    const limit = options.limit ?? 20;
    const startIndex = (page - 1) * limit;
    const activities = sortedActivities.slice(startIndex, startIndex + limit);

    return { activities, total };
  }

  async findByBoardId(
    options: FindManyBoardActivitiesOptions,
  ): Promise<FindManyBoardActivitiesResult> {
    const filteredActivities = this.items.filter((activity) => {
      if (activity.boardId !== options.boardId) return false;
      if (options.type && activity.type !== options.type) return false;
      return true;
    });

    const sortedActivities = filteredActivities.sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    );
    const total = sortedActivities.length;
    const page = options.page ?? 1;
    const limit = options.limit ?? 20;
    const startIndex = (page - 1) * limit;
    const activities = sortedActivities.slice(startIndex, startIndex + limit);

    return { activities, total };
  }
}
