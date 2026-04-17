import { Entity } from '../domain/entities';
import { UniqueEntityID } from '../domain/unique-entity-id';

export interface TrainingProgramProps {
  tenantId: UniqueEntityID;
  name: string;
  description?: string;
  category: string;
  format: string;
  durationHours: number;
  instructor?: string;
  maxParticipants?: number;
  isActive: boolean;
  isMandatory: boolean;
  /**
   * Flag the program as "must auto-enqueue S-2240" — completing a mandatory
   * safety training (NR-10, NR-35 etc.) requires the employer to notify
   * eSocial about the employee's exposure to environmental risks. When true,
   * CompleteEnrollmentUseCase queues an S-2240 DRAFT event for manager
   * review (we do NOT transmit automatically; the event builder needs
   * infoAmb + fatRisco data that only HR can confirm).
   */
  isMandatoryForESocial: boolean;
  validityMonths?: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export class TrainingProgram extends Entity<TrainingProgramProps> {
  get tenantId(): UniqueEntityID {
    return this.props.tenantId;
  }

  get name(): string {
    return this.props.name;
  }

  get description(): string | undefined {
    return this.props.description;
  }

  get category(): string {
    return this.props.category;
  }

  get format(): string {
    return this.props.format;
  }

  get durationHours(): number {
    return this.props.durationHours;
  }

  get instructor(): string | undefined {
    return this.props.instructor;
  }

  get maxParticipants(): number | undefined {
    return this.props.maxParticipants;
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  get isMandatory(): boolean {
    return this.props.isMandatory;
  }

  get isMandatoryForESocial(): boolean {
    return this.props.isMandatoryForESocial;
  }

  get validityMonths(): number | undefined {
    return this.props.validityMonths;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  get deletedAt(): Date | undefined {
    return this.props.deletedAt;
  }

  deactivate(): void {
    this.props.isActive = false;
    this.props.updatedAt = new Date();
  }

  activate(): void {
    this.props.isActive = true;
    this.props.updatedAt = new Date();
  }

  softDelete(): void {
    this.props.deletedAt = new Date();
    this.props.isActive = false;
    this.props.updatedAt = new Date();
  }

  updateName(name: string): void {
    if (!name || name.trim().length === 0) {
      throw new Error('Training program name cannot be empty');
    }
    this.props.name = name;
    this.props.updatedAt = new Date();
  }

  private constructor(props: TrainingProgramProps, id?: UniqueEntityID) {
    super(props, id);
  }

  static create(
    props: Omit<TrainingProgramProps, 'createdAt' | 'updatedAt'> & {
      createdAt?: Date;
      updatedAt?: Date;
    },
    id?: UniqueEntityID,
  ): TrainingProgram {
    const now = new Date();

    return new TrainingProgram(
      {
        ...props,
        isActive: props.isActive ?? true,
        isMandatory: props.isMandatory ?? false,
        isMandatoryForESocial: props.isMandatoryForESocial ?? false,
        createdAt: props.createdAt ?? now,
        updatedAt: props.updatedAt ?? now,
      },
      id,
    );
  }
}
