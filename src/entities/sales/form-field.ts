import { Entity } from '../domain/entities';
import { Optional } from '../domain/optional';
import { UniqueEntityID } from '../domain/unique-entity-id';

export interface FormFieldProps {
  id: UniqueEntityID;
  formId: UniqueEntityID;
  label: string;
  type: string;
  options?: Record<string, unknown>;
  isRequired: boolean;
  order: number;
  createdAt: Date;
  updatedAt?: Date;
}

export class FormField extends Entity<FormFieldProps> {
  get id(): UniqueEntityID {
    return this.props.id;
  }

  get formId(): UniqueEntityID {
    return this.props.formId;
  }

  get label(): string {
    return this.props.label;
  }

  get type(): string {
    return this.props.type;
  }

  get options(): Record<string, unknown> | undefined {
    return this.props.options;
  }

  get isRequired(): boolean {
    return this.props.isRequired;
  }

  get order(): number {
    return this.props.order;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date | undefined {
    return this.props.updatedAt;
  }

  static create(
    props: Optional<FormFieldProps, 'id' | 'createdAt' | 'isRequired'>,
    id?: UniqueEntityID,
  ): FormField {
    const field = new FormField(
      {
        ...props,
        id: id ?? new UniqueEntityID(),
        isRequired: props.isRequired ?? false,
        createdAt: props.createdAt ?? new Date(),
      },
      id,
    );

    return field;
  }
}
