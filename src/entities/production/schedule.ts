import { Entity } from '../domain/entities';
import { Optional } from '../domain/optional';
import { UniqueEntityID } from '../domain/unique-entity-id';

export interface ProductionScheduleProps {
  id: UniqueEntityID;
  tenantId: UniqueEntityID;
  name: string;
  description: string | null;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class ProductionSchedule extends Entity<ProductionScheduleProps> {
  get scheduleId(): UniqueEntityID {
    return this.props.id;
  }

  get tenantId(): UniqueEntityID {
    return this.props.tenantId;
  }

  get name(): string {
    return this.props.name;
  }

  get description(): string | null {
    return this.props.description;
  }

  get startDate(): Date {
    return this.props.startDate;
  }

  get endDate(): Date {
    return this.props.endDate;
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  set name(name: string) {
    this.props.name = name;
    this.touch();
  }

  set description(description: string | null) {
    this.props.description = description;
    this.touch();
  }

  set startDate(startDate: Date) {
    this.props.startDate = startDate;
    this.touch();
  }

  set endDate(endDate: Date) {
    this.props.endDate = endDate;
    this.touch();
  }

  set isActive(isActive: boolean) {
    this.props.isActive = isActive;
    this.touch();
  }

  private touch(): void {
    this.props.updatedAt = new Date();
  }

  static create(
    props: Optional<
      ProductionScheduleProps,
      'id' | 'createdAt' | 'updatedAt' | 'description' | 'isActive'
    >,
    id?: UniqueEntityID,
  ): ProductionSchedule {
    const scheduleId = id ?? props.id ?? new UniqueEntityID();

    const schedule = new ProductionSchedule(
      {
        ...props,
        id: scheduleId,
        description: props.description ?? null,
        isActive: props.isActive ?? true,
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt ?? new Date(),
      },
      scheduleId,
    );

    return schedule;
  }
}
