import { Entity } from '../domain/entities';
import { Optional } from '../domain/optional';
import { UniqueEntityID } from '../domain/unique-entity-id';

export type ScheduleEntryStatus =
  | 'PLANNED'
  | 'CONFIRMED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED';

export interface ProductionScheduleEntryProps {
  id: UniqueEntityID;
  scheduleId: UniqueEntityID;
  productionOrderId: UniqueEntityID | null;
  workstationId: UniqueEntityID | null;
  title: string;
  startDate: Date;
  endDate: Date;
  status: ScheduleEntryStatus;
  color: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class ProductionScheduleEntry extends Entity<ProductionScheduleEntryProps> {
  get entryId(): UniqueEntityID {
    return this.props.id;
  }

  get scheduleId(): UniqueEntityID {
    return this.props.scheduleId;
  }

  get productionOrderId(): UniqueEntityID | null {
    return this.props.productionOrderId;
  }

  get workstationId(): UniqueEntityID | null {
    return this.props.workstationId;
  }

  get title(): string {
    return this.props.title;
  }

  get startDate(): Date {
    return this.props.startDate;
  }

  get endDate(): Date {
    return this.props.endDate;
  }

  get status(): ScheduleEntryStatus {
    return this.props.status;
  }

  get color(): string | null {
    return this.props.color;
  }

  get notes(): string | null {
    return this.props.notes;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  set title(title: string) {
    this.props.title = title;
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

  set workstationId(workstationId: UniqueEntityID | null) {
    this.props.workstationId = workstationId;
    this.touch();
  }

  set status(status: ScheduleEntryStatus) {
    this.props.status = status;
    this.touch();
  }

  set color(color: string | null) {
    this.props.color = color;
    this.touch();
  }

  set notes(notes: string | null) {
    this.props.notes = notes;
    this.touch();
  }

  private touch(): void {
    this.props.updatedAt = new Date();
  }

  static create(
    props: Optional<
      ProductionScheduleEntryProps,
      | 'id'
      | 'createdAt'
      | 'updatedAt'
      | 'productionOrderId'
      | 'workstationId'
      | 'status'
      | 'color'
      | 'notes'
    >,
    id?: UniqueEntityID,
  ): ProductionScheduleEntry {
    const entryId = id ?? props.id ?? new UniqueEntityID();

    const entry = new ProductionScheduleEntry(
      {
        ...props,
        id: entryId,
        productionOrderId: props.productionOrderId ?? null,
        workstationId: props.workstationId ?? null,
        status: props.status ?? 'PLANNED',
        color: props.color ?? null,
        notes: props.notes ?? null,
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt ?? new Date(),
      },
      entryId,
    );

    return entry;
  }
}
