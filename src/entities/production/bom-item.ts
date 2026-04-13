import { Entity } from '../domain/entities';
import { Optional } from '../domain/optional';
import { UniqueEntityID } from '../domain/unique-entity-id';

export interface ProductionBomItemProps {
  id: UniqueEntityID;
  bomId: UniqueEntityID;
  materialId: UniqueEntityID;
  sequence: number;
  quantity: number;
  unit: string;
  wastagePercent: number;
  isOptional: boolean;
  substituteForId: UniqueEntityID | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class ProductionBomItem extends Entity<ProductionBomItemProps> {
  // Getters
  get bomItemId(): UniqueEntityID {
    return this.props.id;
  }

  get bomId(): UniqueEntityID {
    return this.props.bomId;
  }

  get materialId(): UniqueEntityID {
    return this.props.materialId;
  }

  get sequence(): number {
    return this.props.sequence;
  }

  get quantity(): number {
    return this.props.quantity;
  }

  get unit(): string {
    return this.props.unit;
  }

  get wastagePercent(): number {
    return this.props.wastagePercent;
  }

  get isOptional(): boolean {
    return this.props.isOptional;
  }

  get substituteForId(): UniqueEntityID | null {
    return this.props.substituteForId;
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

  // Setters
  set bomId(bomId: UniqueEntityID) {
    this.props.bomId = bomId;
    this.touch();
  }

  set materialId(materialId: UniqueEntityID) {
    this.props.materialId = materialId;
    this.touch();
  }

  set sequence(sequence: number) {
    this.props.sequence = sequence;
    this.touch();
  }

  set quantity(quantity: number) {
    this.props.quantity = quantity;
    this.touch();
  }

  set unit(unit: string) {
    this.props.unit = unit;
    this.touch();
  }

  set wastagePercent(wastagePercent: number) {
    this.props.wastagePercent = wastagePercent;
    this.touch();
  }

  set isOptional(isOptional: boolean) {
    this.props.isOptional = isOptional;
    this.touch();
  }

  set substituteForId(substituteForId: UniqueEntityID | null) {
    this.props.substituteForId = substituteForId;
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
      ProductionBomItemProps,
      | 'id'
      | 'createdAt'
      | 'updatedAt'
      | 'wastagePercent'
      | 'isOptional'
      | 'substituteForId'
      | 'notes'
    >,
    id?: UniqueEntityID,
  ): ProductionBomItem {
    const bomItemId = id ?? props.id ?? new UniqueEntityID();

    const bomItem = new ProductionBomItem(
      {
        ...props,
        id: bomItemId,
        wastagePercent: props.wastagePercent ?? 0,
        isOptional: props.isOptional ?? false,
        substituteForId: props.substituteForId ?? null,
        notes: props.notes ?? null,
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt ?? new Date(),
      },
      bomItemId,
    );

    return bomItem;
  }
}
