import { Entity } from '../domain/entities';
import { UniqueEntityID } from '../domain/unique-entity-id';

export type PPECategory =
  | 'HEAD'
  | 'EYES'
  | 'EARS'
  | 'RESPIRATORY'
  | 'HANDS'
  | 'FEET'
  | 'BODY'
  | 'FALL_PROTECTION';

export interface PPEItemProps {
  tenantId: UniqueEntityID;
  name: string;
  category: PPECategory;
  caNumber?: string;
  manufacturer?: string;
  model?: string;
  expirationMonths?: number;
  minStock: number;
  currentStock: number;
  isActive: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export class PPEItem extends Entity<PPEItemProps> {
  get tenantId(): UniqueEntityID {
    return this.props.tenantId;
  }

  get name(): string {
    return this.props.name;
  }

  get category(): PPECategory {
    return this.props.category;
  }

  get caNumber(): string | undefined {
    return this.props.caNumber;
  }

  get manufacturer(): string | undefined {
    return this.props.manufacturer;
  }

  get model(): string | undefined {
    return this.props.model;
  }

  get expirationMonths(): number | undefined {
    return this.props.expirationMonths;
  }

  get minStock(): number {
    return this.props.minStock;
  }

  get currentStock(): number {
    return this.props.currentStock;
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  get notes(): string | undefined {
    return this.props.notes;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  get deletedAt(): Date | undefined {
    return this.props.deletedAt;
  }

  isLowStock(): boolean {
    return this.currentStock <= this.minStock;
  }

  isOutOfStock(): boolean {
    return this.currentStock <= 0;
  }

  private constructor(props: PPEItemProps, id?: UniqueEntityID) {
    super(props, id);
  }

  static create(
    props: Omit<PPEItemProps, 'createdAt' | 'updatedAt'> & {
      createdAt?: Date;
      updatedAt?: Date;
    },
    id?: UniqueEntityID,
  ): PPEItem {
    const now = new Date();

    if (!props.name || props.name.trim().length === 0) {
      throw new Error('Nome do EPI é obrigatório');
    }

    if (!props.category || props.category.trim().length === 0) {
      throw new Error('Categoria do EPI é obrigatória');
    }

    return new PPEItem(
      {
        ...props,
        name: props.name.trim(),
        minStock: props.minStock ?? 0,
        currentStock: props.currentStock ?? 0,
        isActive: props.isActive ?? true,
        createdAt: props.createdAt ?? now,
        updatedAt: props.updatedAt ?? now,
      },
      id,
    );
  }
}
