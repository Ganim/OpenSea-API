import { Entity } from '../domain/entities';
import { Optional } from '../domain/optional';
import { UniqueEntityID } from '../domain/unique-entity-id';
import type { TicketPriority } from './support-ticket';

export interface SupportSlaConfigProps {
  id: UniqueEntityID;
  priority: TicketPriority;
  firstResponseMinutes: number;
  resolutionMinutes: number;
  createdAt: Date;
  updatedAt: Date;
}

export class SupportSlaConfig extends Entity<SupportSlaConfigProps> {
  get supportSlaConfigId(): UniqueEntityID {
    return this.props.id;
  }
  get priority(): TicketPriority {
    return this.props.priority;
  }
  get firstResponseMinutes(): number {
    return this.props.firstResponseMinutes;
  }
  get resolutionMinutes(): number {
    return this.props.resolutionMinutes;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  set firstResponseMinutes(minutes: number) {
    this.props.firstResponseMinutes = minutes;
    this.touch();
  }
  set resolutionMinutes(minutes: number) {
    this.props.resolutionMinutes = minutes;
    this.touch();
  }

  private touch(): void {
    this.props.updatedAt = new Date();
  }

  static create(
    props: Optional<SupportSlaConfigProps, 'id' | 'createdAt' | 'updatedAt'>,
    id?: UniqueEntityID,
  ): SupportSlaConfig {
    const slaConfigId = id ?? props.id ?? new UniqueEntityID();
    return new SupportSlaConfig(
      {
        ...props,
        id: slaConfigId,
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt ?? new Date(),
      },
      slaConfigId,
    );
  }
}
