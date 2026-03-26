import { Entity } from '../domain/entities';
import { UniqueEntityID } from '../domain/unique-entity-id';

export interface EsocialRubricaProps {
  tenantId: UniqueEntityID;
  code: string;
  description: string;
  type: number; // 1=Vencimento, 2=Desconto, 3=Informativo
  incidInss?: string;
  incidIrrf?: string;
  incidFgts?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class EsocialRubrica extends Entity<EsocialRubricaProps> {
  get tenantId(): UniqueEntityID {
    return this.props.tenantId;
  }

  get code(): string {
    return this.props.code;
  }

  get description(): string {
    return this.props.description;
  }

  get type(): number {
    return this.props.type;
  }

  get incidInss(): string | undefined {
    return this.props.incidInss;
  }

  get incidIrrf(): string | undefined {
    return this.props.incidIrrf;
  }

  get incidFgts(): string | undefined {
    return this.props.incidFgts;
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

  // Domain methods
  getTypeLabel(): string {
    switch (this.props.type) {
      case 1:
        return 'Vencimento';
      case 2:
        return 'Desconto';
      case 3:
        return 'Informativo';
      default:
        return 'Desconhecido';
    }
  }

  updateDescription(description: string): void {
    if (!description || description.trim().length === 0) {
      throw new Error('Description cannot be empty');
    }
    this.props.description = description;
    this.props.updatedAt = new Date();
  }

  activate(): void {
    this.props.isActive = true;
    this.props.updatedAt = new Date();
  }

  deactivate(): void {
    this.props.isActive = false;
    this.props.updatedAt = new Date();
  }

  private constructor(props: EsocialRubricaProps, id?: UniqueEntityID) {
    super(props, id);
  }

  static create(
    props: Omit<EsocialRubricaProps, 'createdAt' | 'updatedAt'> & {
      createdAt?: Date;
      updatedAt?: Date;
    },
    id?: UniqueEntityID,
  ): EsocialRubrica {
    const now = new Date();

    return new EsocialRubrica(
      {
        ...props,
        isActive: props.isActive ?? true,
        createdAt: props.createdAt ?? now,
        updatedAt: props.updatedAt ?? now,
      },
      id,
    );
  }
}
