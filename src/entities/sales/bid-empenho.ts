import { Entity } from '../domain/entities';
import type { Optional } from '../domain/optional';
import { UniqueEntityID } from '../domain/unique-entity-id';

export type BidEmpenhoTypeEnum = 'ORDINARIO' | 'ESTIMATIVO' | 'GLOBAL_EMPENHO';
export type BidEmpenhoStatusType = 'EMITIDO' | 'PARCIALMENTE_LIQUIDADO' | 'LIQUIDADO' | 'ANULADO';

export interface BidEmpenhoProps {
  id: UniqueEntityID;
  tenantId: UniqueEntityID;
  contractId: UniqueEntityID;
  empenhoNumber: string;
  type: BidEmpenhoTypeEnum;
  value: number;
  issueDate: Date;
  status: BidEmpenhoStatusType;
  orderId?: UniqueEntityID;
  notes?: string;
  createdAt: Date;
  updatedAt?: Date;
}

export class BidEmpenho extends Entity<BidEmpenhoProps> {
  get tenantId(): UniqueEntityID { return this.props.tenantId; }
  get contractId(): UniqueEntityID { return this.props.contractId; }
  get empenhoNumber(): string { return this.props.empenhoNumber; }
  get type(): BidEmpenhoTypeEnum { return this.props.type; }
  get value(): number { return this.props.value; }
  get issueDate(): Date { return this.props.issueDate; }
  get status(): BidEmpenhoStatusType { return this.props.status; }
  set status(value: BidEmpenhoStatusType) { this.props.status = value; this.touch(); }
  get orderId(): UniqueEntityID | undefined { return this.props.orderId; }
  set orderId(value: UniqueEntityID | undefined) { this.props.orderId = value; this.touch(); }
  get notes(): string | undefined { return this.props.notes; }
  set notes(value: string | undefined) { this.props.notes = value; this.touch(); }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date | undefined { return this.props.updatedAt; }
  private touch() { this.props.updatedAt = new Date(); }

  static create(props: Optional<BidEmpenhoProps, 'id' | 'createdAt' | 'status'>, id?: UniqueEntityID): BidEmpenho {
    return new BidEmpenho({ ...props, id: props.id ?? id ?? new UniqueEntityID(), status: props.status ?? 'EMITIDO', createdAt: props.createdAt ?? new Date() }, id);
  }
}
