import { Entity } from '../domain/entities';
import { Optional } from '../domain/optional';
import { UniqueEntityID } from '../domain/unique-entity-id';
import type {
  EscalationChannel,
  EscalationTemplateType,
} from './overdue-escalation-types';

export interface OverdueEscalationStepProps {
  id: UniqueEntityID;
  escalationId: UniqueEntityID;
  daysOverdue: number;
  channel: EscalationChannel;
  templateType: EscalationTemplateType;
  subject?: string;
  message: string;
  isActive: boolean;
  order: number;
}

export class OverdueEscalationStep extends Entity<OverdueEscalationStepProps> {
  get id(): UniqueEntityID {
    return this.props.id;
  }
  get escalationId(): UniqueEntityID {
    return this.props.escalationId;
  }

  get daysOverdue(): number {
    return this.props.daysOverdue;
  }
  set daysOverdue(value: number) {
    this.props.daysOverdue = value;
  }

  get channel(): EscalationChannel {
    return this.props.channel;
  }
  set channel(value: EscalationChannel) {
    this.props.channel = value;
  }

  get templateType(): EscalationTemplateType {
    return this.props.templateType;
  }
  set templateType(value: EscalationTemplateType) {
    this.props.templateType = value;
  }

  get subject(): string | undefined {
    return this.props.subject;
  }
  set subject(value: string | undefined) {
    this.props.subject = value;
  }

  get message(): string {
    return this.props.message;
  }
  set message(value: string) {
    this.props.message = value;
  }

  get isActive(): boolean {
    return this.props.isActive;
  }
  set isActive(value: boolean) {
    this.props.isActive = value;
  }

  get order(): number {
    return this.props.order;
  }
  set order(value: number) {
    this.props.order = value;
  }

  static create(
    props: Optional<OverdueEscalationStepProps, 'id' | 'isActive'>,
    id?: UniqueEntityID,
  ): OverdueEscalationStep {
    return new OverdueEscalationStep(
      {
        ...props,
        id: id ?? new UniqueEntityID(),
        isActive: props.isActive ?? true,
      },
      id,
    );
  }
}
