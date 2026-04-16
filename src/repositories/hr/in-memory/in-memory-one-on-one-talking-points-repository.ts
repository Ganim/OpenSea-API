import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { OneOnOneTalkingPoint } from '@/entities/hr/one-on-one-talking-point';
import type {
  CreateOneOnOneTalkingPointSchema,
  OneOnOneTalkingPointsRepository,
} from '../one-on-one-talking-points-repository';

export class InMemoryOneOnOneTalkingPointsRepository
  implements OneOnOneTalkingPointsRepository
{
  public items: OneOnOneTalkingPoint[] = [];

  async create(
    data: CreateOneOnOneTalkingPointSchema,
  ): Promise<OneOnOneTalkingPoint> {
    const position =
      data.position ?? (await this.countByMeeting(data.meetingId));

    const point = OneOnOneTalkingPoint.create({
      meetingId: data.meetingId,
      addedByEmployeeId: data.addedByEmployeeId,
      content: data.content,
      isResolved: false,
      position,
    });

    this.items.push(point);
    return point;
  }

  async findById(id: UniqueEntityID): Promise<OneOnOneTalkingPoint | null> {
    return this.items.find((point) => point.id.equals(id)) ?? null;
  }

  async findManyByMeeting(
    meetingId: UniqueEntityID,
  ): Promise<OneOnOneTalkingPoint[]> {
    return this.items
      .filter((point) => point.meetingId.equals(meetingId))
      .sort((a, b) => a.position - b.position);
  }

  async save(point: OneOnOneTalkingPoint): Promise<void> {
    const index = this.items.findIndex((current) =>
      current.id.equals(point.id),
    );
    if (index >= 0) {
      this.items[index] = point;
    }
  }

  async delete(id: UniqueEntityID): Promise<void> {
    const index = this.items.findIndex((point) => point.id.equals(id));
    if (index >= 0) {
      this.items.splice(index, 1);
    }
  }

  async countByMeeting(meetingId: UniqueEntityID): Promise<number> {
    return this.items.filter((point) => point.meetingId.equals(meetingId))
      .length;
  }
}
