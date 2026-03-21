import { Entity } from '../domain/entities';
import { Optional } from '../domain/optional';
import { UniqueEntityID } from '../domain/unique-entity-id';

export interface PipelineProps {
  id: UniqueEntityID;
  tenantId: UniqueEntityID;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  type: string;
  isDefault: boolean;
  position: number;
  nextPipelineId?: UniqueEntityID;
  isActive: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt?: Date;
}

export class Pipeline extends Entity<PipelineProps> {
  get id(): UniqueEntityID {
    return this.props.id;
  }

  get tenantId(): UniqueEntityID {
    return this.props.tenantId;
  }

  get name(): string {
    return this.props.name;
  }

  set name(name: string) {
    this.props.name = name;
    this.touch();
  }

  get description(): string | undefined {
    return this.props.description;
  }

  set description(description: string | undefined) {
    this.props.description = description;
    this.touch();
  }

  get icon(): string | undefined {
    return this.props.icon;
  }

  set icon(icon: string | undefined) {
    this.props.icon = icon;
    this.touch();
  }

  get color(): string | undefined {
    return this.props.color;
  }

  set color(color: string | undefined) {
    this.props.color = color;
    this.touch();
  }

  get type(): string {
    return this.props.type;
  }

  get isDefault(): boolean {
    return this.props.isDefault;
  }

  set isDefault(isDefault: boolean) {
    this.props.isDefault = isDefault;
    this.touch();
  }

  get position(): number {
    return this.props.position;
  }

  set position(position: number) {
    this.props.position = position;
    this.touch();
  }

  get nextPipelineId(): UniqueEntityID | undefined {
    return this.props.nextPipelineId;
  }

  set nextPipelineId(nextPipelineId: UniqueEntityID | undefined) {
    this.props.nextPipelineId = nextPipelineId;
    this.touch();
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  set isActive(isActive: boolean) {
    this.props.isActive = isActive;
    this.touch();
  }

  get deletedAt(): Date | undefined {
    return this.props.deletedAt;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date | undefined {
    return this.props.updatedAt;
  }

  get isDeleted(): boolean {
    return !!this.props.deletedAt;
  }

  get isCrmPipeline(): boolean {
    return ['SALES', 'ONBOARDING', 'SUPPORT', 'CUSTOM'].includes(
      this.props.type,
    );
  }

  get isOrderPipeline(): boolean {
    return ['ORDER_B2C', 'ORDER_B2B', 'ORDER_BID', 'ORDER_ECOMMERCE'].includes(
      this.props.type,
    );
  }

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
      PipelineProps,
      'id' | 'createdAt' | 'updatedAt' | 'deletedAt' | 'isDefault' | 'isActive' | 'position'
    >,
    id?: UniqueEntityID,
  ): Pipeline {
    const pipeline = new Pipeline(
      {
        ...props,
        id: id ?? new UniqueEntityID(),
        isDefault: props.isDefault ?? false,
        isActive: props.isActive ?? true,
        position: props.position ?? 0,
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt,
        deletedAt: props.deletedAt,
      },
      id,
    );

    return pipeline;
  }
}
