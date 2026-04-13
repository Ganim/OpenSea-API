import { Entity } from '../domain/entities';
import { Optional } from '../domain/optional';
import { UniqueEntityID } from '../domain/unique-entity-id';

export interface ProductionEntryProps {
  id: UniqueEntityID;
  jobCardId: UniqueEntityID;
  operatorId: UniqueEntityID;
  quantityGood: number;
  quantityScrapped: number;
  quantityRework: number;
  enteredAt: Date;
  notes: string | null;
}

export class ProductionEntry extends Entity<ProductionEntryProps> {
  get productionEntryId(): UniqueEntityID {
    return this.props.id;
  }

  get jobCardId(): UniqueEntityID {
    return this.props.jobCardId;
  }

  get operatorId(): UniqueEntityID {
    return this.props.operatorId;
  }

  get quantityGood(): number {
    return this.props.quantityGood;
  }

  get quantityScrapped(): number {
    return this.props.quantityScrapped;
  }

  get quantityRework(): number {
    return this.props.quantityRework;
  }

  get enteredAt(): Date {
    return this.props.enteredAt;
  }

  get notes(): string | null {
    return this.props.notes;
  }

  /** Total quantity produced (good + scrapped + rework) */
  get totalQuantity(): number {
    return (
      this.props.quantityGood +
      this.props.quantityScrapped +
      this.props.quantityRework
    );
  }

  static create(
    props: Optional<
      ProductionEntryProps,
      'id' | 'enteredAt' | 'quantityScrapped' | 'quantityRework' | 'notes'
    >,
    id?: UniqueEntityID,
  ): ProductionEntry {
    const entryId = id ?? props.id ?? new UniqueEntityID();

    const entry = new ProductionEntry(
      {
        ...props,
        id: entryId,
        quantityScrapped: props.quantityScrapped ?? 0,
        quantityRework: props.quantityRework ?? 0,
        notes: props.notes ?? null,
        enteredAt: props.enteredAt ?? new Date(),
      },
      entryId,
    );

    return entry;
  }
}
