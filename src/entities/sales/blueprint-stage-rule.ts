import { Entity } from '../domain/entities';
import type { Optional } from '../domain/optional';
import { UniqueEntityID } from '../domain/unique-entity-id';

export interface StageValidation {
  field: string;
  condition: string;
  value: string;
}

export interface BlueprintStageRuleProps {
  id: UniqueEntityID;
  blueprintId: UniqueEntityID;
  stageId: UniqueEntityID;
  requiredFields: string[];
  validations: StageValidation[];
  blocksAdvance: boolean;
  createdAt: Date;
  updatedAt?: Date;
}

export class BlueprintStageRule extends Entity<BlueprintStageRuleProps> {
  get id(): UniqueEntityID {
    return this.props.id;
  }

  get blueprintId(): UniqueEntityID {
    return this.props.blueprintId;
  }

  get stageId(): UniqueEntityID {
    return this.props.stageId;
  }

  get requiredFields(): string[] {
    return this.props.requiredFields;
  }

  set requiredFields(requiredFields: string[]) {
    this.props.requiredFields = requiredFields;
    this.touch();
  }

  get validations(): StageValidation[] {
    return this.props.validations;
  }

  set validations(validations: StageValidation[]) {
    this.props.validations = validations;
    this.touch();
  }

  get blocksAdvance(): boolean {
    return this.props.blocksAdvance;
  }

  set blocksAdvance(blocksAdvance: boolean) {
    this.props.blocksAdvance = blocksAdvance;
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
    props: Optional<
      BlueprintStageRuleProps,
      | 'id'
      | 'createdAt'
      | 'updatedAt'
      | 'requiredFields'
      | 'validations'
      | 'blocksAdvance'
    >,
    id?: UniqueEntityID,
  ): BlueprintStageRule {
    return new BlueprintStageRule(
      {
        ...props,
        id: id ?? new UniqueEntityID(),
        requiredFields: props.requiredFields ?? [],
        validations: props.validations ?? [],
        blocksAdvance: props.blocksAdvance ?? true,
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt,
      },
      id,
    );
  }
}
