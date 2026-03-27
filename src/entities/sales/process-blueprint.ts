import { Entity } from '../domain/entities';
import type { Optional } from '../domain/optional';
import { UniqueEntityID } from '../domain/unique-entity-id';
import type { BlueprintStageRule } from './blueprint-stage-rule';

export interface ProcessBlueprintProps {
  id: UniqueEntityID;
  tenantId: UniqueEntityID;
  name: string;
  pipelineId: UniqueEntityID;
  isActive: boolean;
  stageRules: BlueprintStageRule[];
  createdAt: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

export class ProcessBlueprint extends Entity<ProcessBlueprintProps> {
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

  get pipelineId(): UniqueEntityID {
    return this.props.pipelineId;
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  set isActive(isActive: boolean) {
    this.props.isActive = isActive;
    this.touch();
  }

  get stageRules(): BlueprintStageRule[] {
    return this.props.stageRules;
  }

  set stageRules(stageRules: BlueprintStageRule[]) {
    this.props.stageRules = stageRules;
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

  get isDeleted(): boolean {
    return !!this.props.deletedAt;
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
      ProcessBlueprintProps,
      'id' | 'createdAt' | 'updatedAt' | 'deletedAt' | 'isActive' | 'stageRules'
    >,
    id?: UniqueEntityID,
  ): ProcessBlueprint {
    return new ProcessBlueprint(
      {
        ...props,
        id: id ?? new UniqueEntityID(),
        isActive: props.isActive ?? true,
        stageRules: props.stageRules ?? [],
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt,
        deletedAt: props.deletedAt,
      },
      id,
    );
  }
}
