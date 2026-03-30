import { Entity } from '../domain/entities';
import { UniqueEntityID } from '../domain/unique-entity-id';

export interface SurveyAnswerProps {
  tenantId: UniqueEntityID;
  surveyResponseId: UniqueEntityID;
  questionId: UniqueEntityID;
  ratingValue?: number;
  textValue?: string;
  selectedOptions?: unknown;
  createdAt: Date;
}

export class SurveyAnswer extends Entity<SurveyAnswerProps> {
  get tenantId(): UniqueEntityID {
    return this.props.tenantId;
  }

  get surveyResponseId(): UniqueEntityID {
    return this.props.surveyResponseId;
  }

  get questionId(): UniqueEntityID {
    return this.props.questionId;
  }

  get ratingValue(): number | undefined {
    return this.props.ratingValue;
  }

  get textValue(): string | undefined {
    return this.props.textValue;
  }

  get selectedOptions(): unknown | undefined {
    return this.props.selectedOptions;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  private constructor(props: SurveyAnswerProps, id?: UniqueEntityID) {
    super(props, id);
  }

  static create(
    props: Omit<SurveyAnswerProps, 'createdAt'> & {
      createdAt?: Date;
    },
    id?: UniqueEntityID,
  ): SurveyAnswer {
    const now = new Date();

    return new SurveyAnswer(
      {
        ...props,
        createdAt: props.createdAt ?? now,
      },
      id,
    );
  }
}
