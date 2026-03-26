import { Entity } from '../domain/entities';
import { Optional } from '../domain/optional';
import { UniqueEntityID } from '../domain/unique-entity-id';

export interface FormSubmissionProps {
  id: UniqueEntityID;
  formId: UniqueEntityID;
  data: Record<string, unknown>;
  submittedBy?: string;
  createdAt: Date;
}

export class FormSubmission extends Entity<FormSubmissionProps> {
  get id(): UniqueEntityID {
    return this.props.id;
  }

  get formId(): UniqueEntityID {
    return this.props.formId;
  }

  get data(): Record<string, unknown> {
    return this.props.data;
  }

  get submittedBy(): string | undefined {
    return this.props.submittedBy;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  static create(
    props: Optional<FormSubmissionProps, 'id' | 'createdAt'>,
    id?: UniqueEntityID,
  ): FormSubmission {
    const submission = new FormSubmission(
      {
        ...props,
        id: id ?? new UniqueEntityID(),
        createdAt: props.createdAt ?? new Date(),
      },
      id,
    );

    return submission;
  }
}
