import { Entity } from '../domain/entities';
import { UniqueEntityID } from '../domain/unique-entity-id';
import type { MedicalExamType } from './medical-exam';

export interface OccupationalExamRequirementProps {
  tenantId: UniqueEntityID;
  positionId?: UniqueEntityID;
  examType: string;
  examCategory: MedicalExamType;
  frequencyMonths: number;
  isMandatory: boolean;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class OccupationalExamRequirement extends Entity<OccupationalExamRequirementProps> {
  get tenantId(): UniqueEntityID {
    return this.props.tenantId;
  }

  get positionId(): UniqueEntityID | undefined {
    return this.props.positionId;
  }

  get examType(): string {
    return this.props.examType;
  }

  get examCategory(): MedicalExamType {
    return this.props.examCategory;
  }

  get frequencyMonths(): number {
    return this.props.frequencyMonths;
  }

  get isMandatory(): boolean {
    return this.props.isMandatory;
  }

  get description(): string | undefined {
    return this.props.description;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  private constructor(
    props: OccupationalExamRequirementProps,
    id?: UniqueEntityID,
  ) {
    super(props, id);
  }

  static create(
    props: Omit<OccupationalExamRequirementProps, 'createdAt' | 'updatedAt'> & {
      createdAt?: Date;
      updatedAt?: Date;
    },
    id?: UniqueEntityID,
  ): OccupationalExamRequirement {
    const now = new Date();

    if (!props.examType || props.examType.trim().length === 0) {
      throw new Error('O tipo de exame é obrigatório');
    }

    if (!props.examCategory) {
      throw new Error('A categoria do exame é obrigatória');
    }

    if (props.frequencyMonths < 1) {
      throw new Error('A frequência deve ser de pelo menos 1 mês');
    }

    return new OccupationalExamRequirement(
      {
        ...props,
        examType: props.examType.trim(),
        description: props.description?.trim(),
        createdAt: props.createdAt ?? now,
        updatedAt: props.updatedAt ?? now,
      },
      id,
    );
  }
}
