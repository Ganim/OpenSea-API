import { Entity } from '../domain/entities';
import { Optional } from '../domain/optional';
import { UniqueEntityID } from '../domain/unique-entity-id';

export interface TemplateProps {
  id: UniqueEntityID;
  name: string;
  productAttributes: Record<string, unknown>;
  variantAttributes: Record<string, unknown>;
  itemAttributes: Record<string, unknown>;
  createdAt: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

export class Template extends Entity<TemplateProps> {
  get id(): UniqueEntityID {
    return this.props.id;
  }

  get name(): string {
    return this.props.name;
  }

  set name(name: string) {
    this.props.name = name;
    this.touch();
  }

  get productAttributes(): Record<string, unknown> {
    return this.props.productAttributes;
  }

  set productAttributes(attributes: Record<string, unknown>) {
    this.props.productAttributes = attributes;
    this.touch();
  }

  get variantAttributes(): Record<string, unknown> {
    return this.props.variantAttributes;
  }

  set variantAttributes(attributes: Record<string, unknown>) {
    this.props.variantAttributes = attributes;
    this.touch();
  }

  get itemAttributes(): Record<string, unknown> {
    return this.props.itemAttributes;
  }

  set itemAttributes(attributes: Record<string, unknown>) {
    this.props.itemAttributes = attributes;
    this.touch();
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date | undefined {
    return this.props.updatedAt;
  }

  get deletedAt(): Date | undefined {
    return this.props.deletedAt;
  }

  // Computed Properties
  get isDeleted(): boolean {
    return !!this.props.deletedAt;
  }

  get hasProductAttributes(): boolean {
    return Object.keys(this.props.productAttributes).length > 0;
  }

  get hasVariantAttributes(): boolean {
    return Object.keys(this.props.variantAttributes).length > 0;
  }

  get hasItemAttributes(): boolean {
    return Object.keys(this.props.itemAttributes).length > 0;
  }

  // Business Methods
  delete(): void {
    this.props.deletedAt = new Date();
    this.touch();
  }

  restore(): void {
    this.props.deletedAt = undefined;
    this.touch();
  }

  private touch(): void {
    this.props.updatedAt = new Date();
  }

  static create(
    props: Optional<
      TemplateProps,
      'id' | 'createdAt' | 'updatedAt' | 'deletedAt'
    >,
    id?: UniqueEntityID,
  ): Template {
    const template = new Template(
      {
        ...props,
        id: id ?? new UniqueEntityID(),
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt,
        deletedAt: props.deletedAt,
      },
      id,
    );

    return template;
  }
}
