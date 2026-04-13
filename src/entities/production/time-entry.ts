import { Entity } from '../domain/entities';
import { Optional } from '../domain/optional';
import { UniqueEntityID } from '../domain/unique-entity-id';

export type ProductionTimeEntryType =
  | 'PRODUCTION'
  | 'SETUP'
  | 'REWORK'
  | 'IDLE';

export interface ProductionTimeEntryProps {
  id: UniqueEntityID;
  jobCardId: UniqueEntityID;
  operatorId: UniqueEntityID;
  startTime: Date;
  endTime: Date | null;
  breakMinutes: number;
  entryType: ProductionTimeEntryType;
  notes: string | null;
  createdAt: Date;
}

export class ProductionTimeEntry extends Entity<ProductionTimeEntryProps> {
  get timeEntryId(): UniqueEntityID {
    return this.props.id;
  }

  get jobCardId(): UniqueEntityID {
    return this.props.jobCardId;
  }

  get operatorId(): UniqueEntityID {
    return this.props.operatorId;
  }

  get startTime(): Date {
    return this.props.startTime;
  }

  get endTime(): Date | null {
    return this.props.endTime;
  }

  get breakMinutes(): number {
    return this.props.breakMinutes;
  }

  get entryType(): ProductionTimeEntryType {
    return this.props.entryType;
  }

  get notes(): string | null {
    return this.props.notes;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  /**
   * Computed duration in minutes: (endTime - startTime) / 60000 - breakMinutes.
   * Returns null when endTime is not set (entry still running).
   */
  get durationMinutes(): number | null {
    if (!this.props.endTime) {
      return null;
    }

    const rawMinutes = Math.ceil(
      (this.props.endTime.getTime() - this.props.startTime.getTime()) / 60000,
    );

    return Math.max(0, rawMinutes - this.props.breakMinutes);
  }

  // Setters
  set endTime(endTime: Date | null) {
    this.props.endTime = endTime;
  }

  set breakMinutes(breakMinutes: number) {
    this.props.breakMinutes = breakMinutes;
  }

  set notes(notes: string | null) {
    this.props.notes = notes;
  }

  // Business methods
  end(endTime: Date): void {
    this.props.endTime = endTime;
  }

  static create(
    props: Optional<
      ProductionTimeEntryProps,
      'id' | 'createdAt' | 'endTime' | 'breakMinutes' | 'entryType' | 'notes'
    >,
    id?: UniqueEntityID,
  ): ProductionTimeEntry {
    const entryId = id ?? props.id ?? new UniqueEntityID();

    const entry = new ProductionTimeEntry(
      {
        ...props,
        id: entryId,
        endTime: props.endTime ?? null,
        breakMinutes: props.breakMinutes ?? 0,
        entryType: props.entryType ?? 'PRODUCTION',
        notes: props.notes ?? null,
        createdAt: props.createdAt ?? new Date(),
      },
      entryId,
    );

    return entry;
  }
}
