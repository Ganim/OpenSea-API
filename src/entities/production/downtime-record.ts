import { Entity } from '../domain/entities';
import { Optional } from '../domain/optional';
import { UniqueEntityID } from '../domain/unique-entity-id';

export interface ProductionDowntimeRecordProps {
  id: UniqueEntityID;
  workstationId: UniqueEntityID;
  downtimeReasonId: UniqueEntityID;
  startTime: Date;
  endTime: Date | null;
  durationMinutes: number | null;
  reportedById: UniqueEntityID;
  notes: string | null;
  createdAt: Date;
}

export class ProductionDowntimeRecord extends Entity<ProductionDowntimeRecordProps> {
  get downtimeRecordId(): UniqueEntityID {
    return this.props.id;
  }

  get workstationId(): UniqueEntityID {
    return this.props.workstationId;
  }

  get downtimeReasonId(): UniqueEntityID {
    return this.props.downtimeReasonId;
  }

  get startTime(): Date {
    return this.props.startTime;
  }

  get endTime(): Date | null {
    return this.props.endTime;
  }

  get durationMinutes(): number | null {
    return this.props.durationMinutes;
  }

  get reportedById(): UniqueEntityID {
    return this.props.reportedById;
  }

  get notes(): string | null {
    return this.props.notes;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  // Setters
  set endTime(endTime: Date | null) {
    this.props.endTime = endTime;
  }

  set durationMinutes(durationMinutes: number | null) {
    this.props.durationMinutes = durationMinutes;
  }

  set notes(notes: string | null) {
    this.props.notes = notes;
  }

  // Business methods
  end(endTime: Date): void {
    this.props.endTime = endTime;
    this.props.durationMinutes = Math.ceil(
      (endTime.getTime() - this.props.startTime.getTime()) / 60000,
    );
  }

  static create(
    props: Optional<
      ProductionDowntimeRecordProps,
      'id' | 'createdAt' | 'endTime' | 'durationMinutes' | 'notes'
    >,
    id?: UniqueEntityID,
  ): ProductionDowntimeRecord {
    const recordId = id ?? props.id ?? new UniqueEntityID();

    const record = new ProductionDowntimeRecord(
      {
        ...props,
        id: recordId,
        endTime: props.endTime ?? null,
        durationMinutes: props.durationMinutes ?? null,
        notes: props.notes ?? null,
        createdAt: props.createdAt ?? new Date(),
      },
      recordId,
    );

    return record;
  }
}
