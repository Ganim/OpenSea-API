import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { EsocialEvent } from '@/entities/esocial/esocial-event';
import { EsocialEventStatus } from '@/entities/esocial/value-objects/event-status';
import type {
  CreateEsocialEventData,
  EsocialEventsRepository,
  FindManyEsocialEventsParams,
  FindManyEsocialEventsResult,
} from '../esocial-events-repository';

/**
 * Minimal in-memory implementation used by HR unit tests that exercise the
 * auto-enqueue S-2240 DRAFT path in CompleteEnrollmentUseCase. It captures
 * every `create` call so tests can assert that the right event type,
 * status, and referenceId landed on the queue without booting Prisma.
 */
export class InMemoryEsocialEventsRepository
  implements EsocialEventsRepository
{
  public items: EsocialEvent[] = [];

  async create(data: CreateEsocialEventData): Promise<EsocialEvent> {
    const event = EsocialEvent.create({
      tenantId: new UniqueEntityID(data.tenantId),
      eventType: data.eventType,
      status: (data.status as EsocialEventStatus) ?? EsocialEventStatus.DRAFT,
      referenceId: data.referenceId,
      referenceType: data.referenceType,
      xmlContent: data.xmlContent,
      xmlHash: data.xmlHash,
      retryCount: 0,
      isRectification: data.isRectification ?? false,
      originalEventId: data.originalEventId
        ? new UniqueEntityID(data.originalEventId)
        : undefined,
      deadline: data.deadline,
    });

    this.items.push(event);
    return event;
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<EsocialEvent | null> {
    return (
      this.items.find(
        (event) =>
          event.id.equals(id) && event.tenantId.toString() === tenantId,
      ) ?? null
    );
  }

  async findMany(
    params: FindManyEsocialEventsParams,
  ): Promise<FindManyEsocialEventsResult> {
    let filtered = this.items.filter(
      (event) => event.tenantId.toString() === params.tenantId,
    );

    if (params.status) {
      filtered = filtered.filter((event) => event.status === params.status);
    }
    if (params.eventType) {
      filtered = filtered.filter(
        (event) => event.eventType === params.eventType,
      );
    }
    if (params.referenceId) {
      filtered = filtered.filter(
        (event) => event.referenceId === params.referenceId,
      );
    }
    if (params.referenceType) {
      filtered = filtered.filter(
        (event) => event.referenceType === params.referenceType,
      );
    }

    const total = filtered.length;
    const page = params.page ?? 1;
    const perPage = Math.min(params.perPage ?? 20, 100);

    return {
      events: filtered.slice((page - 1) * perPage, page * perPage),
      total,
    };
  }

  async save(event: EsocialEvent): Promise<void> {
    const index = this.items.findIndex((item) => item.id.equals(event.id));
    if (index >= 0) {
      this.items[index] = event;
    }
  }

  async delete(id: UniqueEntityID): Promise<void> {
    const index = this.items.findIndex((item) => item.id.equals(id));
    if (index >= 0) {
      this.items.splice(index, 1);
    }
  }
}
