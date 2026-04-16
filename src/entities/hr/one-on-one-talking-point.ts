import { Entity } from '../domain/entities';
import { UniqueEntityID } from '../domain/unique-entity-id';

export interface OneOnOneTalkingPointProps {
  meetingId: UniqueEntityID;
  addedByEmployeeId: UniqueEntityID;
  content: string;
  isResolved: boolean;
  position: number;
  createdAt: Date;
}

export class OneOnOneTalkingPoint extends Entity<OneOnOneTalkingPointProps> {
  get meetingId(): UniqueEntityID {
    return this.props.meetingId;
  }

  get addedByEmployeeId(): UniqueEntityID {
    return this.props.addedByEmployeeId;
  }

  get content(): string {
    return this.props.content;
  }

  set content(value: string) {
    this.props.content = value;
  }

  get isResolved(): boolean {
    return this.props.isResolved;
  }

  get position(): number {
    return this.props.position;
  }

  set position(value: number) {
    this.props.position = value;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  toggleResolved(): void {
    this.props.isResolved = !this.props.isResolved;
  }

  setResolved(value: boolean): void {
    this.props.isResolved = value;
  }

  isAuthor(employeeId: UniqueEntityID): boolean {
    return this.addedByEmployeeId.equals(employeeId);
  }

  private constructor(props: OneOnOneTalkingPointProps, id?: UniqueEntityID) {
    super(props, id);
  }

  static create(
    props: Omit<OneOnOneTalkingPointProps, 'createdAt'> & { createdAt?: Date },
    id?: UniqueEntityID,
  ): OneOnOneTalkingPoint {
    return new OneOnOneTalkingPoint(
      {
        ...props,
        createdAt: props.createdAt ?? new Date(),
      },
      id,
    );
  }
}
