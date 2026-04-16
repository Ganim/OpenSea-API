import { Entity } from '../domain/entities';
import { UniqueEntityID } from '../domain/unique-entity-id';

export type ContractTemplateTypeValue =
  | 'CLT'
  | 'PJ'
  | 'INTERN'
  | 'TEMPORARY'
  | 'EXPERIENCE'
  | 'CUSTOM';

export interface ContractTemplateProps {
  tenantId: UniqueEntityID;
  name: string;
  type: ContractTemplateTypeValue;
  content: string;
  isActive: boolean;
  isDefault: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class ContractTemplate extends Entity<ContractTemplateProps> {
  get tenantId(): UniqueEntityID {
    return this.props.tenantId;
  }

  get name(): string {
    return this.props.name;
  }

  get type(): ContractTemplateTypeValue {
    return this.props.type;
  }

  get content(): string {
    return this.props.content;
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  get isDefault(): boolean {
    return this.props.isDefault;
  }

  get deletedAt(): Date | undefined {
    return this.props.deletedAt;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  isDeleted(): boolean {
    return this.deletedAt !== undefined;
  }

  rename(name: string): void {
    if (!name || name.trim().length === 0) {
      throw new Error('Contract template name cannot be empty');
    }
    this.props.name = name;
    this.props.updatedAt = new Date();
  }

  updateContent(content: string): void {
    if (!content || content.trim().length === 0) {
      throw new Error('Contract template content cannot be empty');
    }
    this.props.content = content;
    this.props.updatedAt = new Date();
  }

  changeType(type: ContractTemplateTypeValue): void {
    this.props.type = type;
    this.props.updatedAt = new Date();
  }

  activate(): void {
    if (this.isDeleted()) {
      throw new Error('Cannot activate a deleted template');
    }
    this.props.isActive = true;
    this.props.updatedAt = new Date();
  }

  deactivate(): void {
    this.props.isActive = false;
    this.props.isDefault = false;
    this.props.updatedAt = new Date();
  }

  markAsDefault(): void {
    if (!this.isActive) {
      throw new Error('Cannot mark an inactive template as default');
    }
    this.props.isDefault = true;
    this.props.updatedAt = new Date();
  }

  unmarkAsDefault(): void {
    this.props.isDefault = false;
    this.props.updatedAt = new Date();
  }

  softDelete(): void {
    this.props.deletedAt = new Date();
    this.props.isActive = false;
    this.props.isDefault = false;
    this.props.updatedAt = new Date();
  }

  private constructor(props: ContractTemplateProps, id?: UniqueEntityID) {
    super(props, id);
  }

  static create(
    props: Omit<ContractTemplateProps, 'createdAt' | 'updatedAt'> & {
      createdAt?: Date;
      updatedAt?: Date;
    },
    id?: UniqueEntityID,
  ): ContractTemplate {
    const now = new Date();

    return new ContractTemplate(
      {
        ...props,
        isActive: props.isActive ?? true,
        isDefault: props.isDefault ?? false,
        createdAt: props.createdAt ?? now,
        updatedAt: props.updatedAt ?? now,
      },
      id,
    );
  }
}
