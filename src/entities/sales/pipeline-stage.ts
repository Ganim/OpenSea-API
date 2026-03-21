import { Entity } from '../domain/entities';
import type { Optional } from '../domain/optional';
import { UniqueEntityID } from '../domain/unique-entity-id';

export interface PipelineStageProps {
  id: UniqueEntityID;
  pipelineId: UniqueEntityID;
  name: string;
  color?: string;
  icon?: string;
  position: number;
  type: string;
  probability?: number;
  autoActions?: Record<string, unknown>;
  rottenAfterDays?: number;
  createdAt: Date;
  updatedAt?: Date;
}

export class PipelineStage extends Entity<PipelineStageProps> {
  get id(): UniqueEntityID {
    return this.props.id;
  }

  get pipelineId(): UniqueEntityID {
    return this.props.pipelineId;
  }

  get name(): string {
    return this.props.name;
  }

  set name(name: string) {
    this.props.name = name;
    this.touch();
  }

  get color(): string | undefined {
    return this.props.color;
  }

  set color(color: string | undefined) {
    this.props.color = color;
    this.touch();
  }

  get icon(): string | undefined {
    return this.props.icon;
  }

  set icon(icon: string | undefined) {
    this.props.icon = icon;
    this.touch();
  }

  get position(): number {
    return this.props.position;
  }

  set position(position: number) {
    this.props.position = position;
    this.touch();
  }

  get type(): string {
    return this.props.type;
  }

  set type(type: string) {
    this.props.type = type;
    this.touch();
  }

  get probability(): number | undefined {
    return this.props.probability;
  }

  set probability(probability: number | undefined) {
    this.props.probability = probability;
    this.touch();
  }

  get autoActions(): Record<string, unknown> | undefined {
    return this.props.autoActions;
  }

  set autoActions(autoActions: Record<string, unknown> | undefined) {
    this.props.autoActions = autoActions;
    this.touch();
  }

  get rottenAfterDays(): number | undefined {
    return this.props.rottenAfterDays;
  }

  set rottenAfterDays(rottenAfterDays: number | undefined) {
    this.props.rottenAfterDays = rottenAfterDays;
    this.touch();
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date | undefined {
    return this.props.updatedAt;
  }

  private touch(): void {
    this.props.updatedAt = new Date();
  }

  static create(
    props: Optional<PipelineStageProps, 'id' | 'createdAt' | 'updatedAt' | 'position'>,
    id?: UniqueEntityID,
  ): PipelineStage {
    return new PipelineStage(
      {
        ...props,
        id: id ?? new UniqueEntityID(),
        position: props.position ?? 0,
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt,
      },
      id,
    );
  }
}
