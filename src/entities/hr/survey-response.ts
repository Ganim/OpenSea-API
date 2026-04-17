import { Entity } from '../domain/entities';
import { UniqueEntityID } from '../domain/unique-entity-id';

export interface SurveyResponseProps {
  tenantId: UniqueEntityID;
  surveyId: UniqueEntityID;
  employeeId?: UniqueEntityID;
  /**
   * Anonymity-preserving dedupe hash.
   * Only populated when the survey is anonymous; in that case employeeId is
   * forced to undefined and this hash is the only way the server can detect
   * duplicate submissions by the same respondent. Internal only — never
   * exposed through any API layer.
   */
  respondentHash?: string;
  submittedAt: Date;
  createdAt: Date;
}

export class SurveyResponse extends Entity<SurveyResponseProps> {
  get tenantId(): UniqueEntityID {
    return this.props.tenantId;
  }

  get surveyId(): UniqueEntityID {
    return this.props.surveyId;
  }

  get employeeId(): UniqueEntityID | undefined {
    return this.props.employeeId;
  }

  get respondentHash(): string | undefined {
    return this.props.respondentHash;
  }

  get submittedAt(): Date {
    return this.props.submittedAt;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  private constructor(props: SurveyResponseProps, id?: UniqueEntityID) {
    super(props, id);
  }

  static create(
    props: Omit<SurveyResponseProps, 'submittedAt' | 'createdAt'> & {
      submittedAt?: Date;
      createdAt?: Date;
    },
    id?: UniqueEntityID,
  ): SurveyResponse {
    const now = new Date();

    return new SurveyResponse(
      {
        ...props,
        submittedAt: props.submittedAt ?? now,
        createdAt: props.createdAt ?? now,
      },
      id,
    );
  }
}
