import { Entity } from '../domain/entities';
import { UniqueEntityID } from '../domain/unique-entity-id';

export interface SurveyQuestionProps {
  tenantId: UniqueEntityID;
  surveyId: UniqueEntityID;
  text: string;
  type: string;
  options?: unknown;
  order: number;
  isRequired: boolean;
  category: string;
  createdAt: Date;
  updatedAt: Date;
}

export class SurveyQuestion extends Entity<SurveyQuestionProps> {
  get tenantId(): UniqueEntityID {
    return this.props.tenantId;
  }

  get surveyId(): UniqueEntityID {
    return this.props.surveyId;
  }

  get text(): string {
    return this.props.text;
  }

  get type(): string {
    return this.props.type;
  }

  get options(): unknown | undefined {
    return this.props.options;
  }

  get order(): number {
    return this.props.order;
  }

  get isRequired(): boolean {
    return this.props.isRequired;
  }

  get category(): string {
    return this.props.category;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  updateText(text: string): void {
    this.props.text = text;
    this.props.updatedAt = new Date();
  }

  updateOrder(order: number): void {
    this.props.order = order;
    this.props.updatedAt = new Date();
  }

  private constructor(props: SurveyQuestionProps, id?: UniqueEntityID) {
    super(props, id);
  }

  static create(
    props: Omit<SurveyQuestionProps, 'createdAt' | 'updatedAt'> & {
      createdAt?: Date;
      updatedAt?: Date;
    },
    id?: UniqueEntityID,
  ): SurveyQuestion {
    const now = new Date();

    return new SurveyQuestion(
      {
        ...props,
        isRequired: props.isRequired ?? true,
        createdAt: props.createdAt ?? now,
        updatedAt: props.updatedAt ?? now,
      },
      id,
    );
  }
}
