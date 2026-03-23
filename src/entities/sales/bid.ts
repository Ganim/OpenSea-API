import { Entity } from '../domain/entities';
import type { Optional } from '../domain/optional';
import { UniqueEntityID } from '../domain/unique-entity-id';

export type BidModality =
  | 'PREGAO_ELETRONICO'
  | 'PREGAO_PRESENCIAL'
  | 'CONCORRENCIA'
  | 'TOMADA_PRECOS'
  | 'CONVITE'
  | 'LEILAO'
  | 'DIALOGO_COMPETITIVO'
  | 'CONCURSO'
  | 'DISPENSA'
  | 'INEXIGIBILIDADE';

export type BidCriterion =
  | 'MENOR_PRECO'
  | 'MAIOR_DESCONTO'
  | 'MELHOR_TECNICA'
  | 'TECNICA_PRECO'
  | 'MAIOR_LANCE'
  | 'MAIOR_RETORNO';

export type BidLegalFramework =
  | 'LEI_14133_2021'
  | 'LEI_8666_1993'
  | 'LEI_10520_2002'
  | 'LEI_12462_2011'
  | 'DECRETO_10024_2019';

export type BidExecutionRegime =
  | 'EMPREITADA_PRECO_GLOBAL'
  | 'EMPREITADA_PRECO_UNITARIO'
  | 'TAREFA'
  | 'INTEGRAL'
  | 'FORNECIMENTO_REGIME_PRECO';

export type BidStatusType =
  | 'DISCOVERED'
  | 'ANALYZING'
  | 'VIABLE'
  | 'NOT_VIABLE'
  | 'PREPARING'
  | 'PROPOSAL_SENT'
  | 'AWAITING_DISPUTE'
  | 'IN_DISPUTE'
  | 'WON'
  | 'LOST'
  | 'DESERTED'
  | 'REVOKED'
  | 'SUSPENDED'
  | 'MONITORING'
  | 'CONTRACTED'
  | 'COMPLETED'
  | 'ARCHIVED';

export interface BidProps {
  id: UniqueEntityID;
  tenantId: UniqueEntityID;
  portalName: string;
  portalEditalId?: string;
  editalNumber: string;
  modality: BidModality;
  criterionType: BidCriterion;
  legalFramework: BidLegalFramework;
  executionRegime?: BidExecutionRegime;
  object: string;
  objectSummary?: string;
  organName: string;
  organCnpj?: string;
  organState?: string;
  organCity?: string;
  estimatedValue?: number;
  ourProposalValue?: number;
  finalValue?: number;
  margin?: number;
  publicationDate?: Date;
  openingDate: Date;
  closingDate?: Date;
  disputeDate?: Date;
  status: BidStatusType;
  viabilityScore?: number;
  viabilityReason?: string;
  customerId?: UniqueEntityID;
  assignedToUserId?: UniqueEntityID;
  exclusiveMeEpp: boolean;
  deliveryStates: string[];
  tags: string[];
  notes?: string;
  editalUrl?: string;
  editalFileId?: UniqueEntityID;
  etpFileId?: UniqueEntityID;
  trFileId?: UniqueEntityID;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt?: Date;
}

export class Bid extends Entity<BidProps> {
  get tenantId(): UniqueEntityID {
    return this.props.tenantId;
  }
  get portalName(): string {
    return this.props.portalName;
  }
  get portalEditalId(): string | undefined {
    return this.props.portalEditalId;
  }
  get editalNumber(): string {
    return this.props.editalNumber;
  }
  get modality(): BidModality {
    return this.props.modality;
  }
  set modality(value: BidModality) {
    this.props.modality = value;
    this.touch();
  }
  get criterionType(): BidCriterion {
    return this.props.criterionType;
  }
  get legalFramework(): BidLegalFramework {
    return this.props.legalFramework;
  }
  get executionRegime(): BidExecutionRegime | undefined {
    return this.props.executionRegime;
  }
  get object(): string {
    return this.props.object;
  }
  set object(value: string) {
    this.props.object = value;
    this.touch();
  }
  get objectSummary(): string | undefined {
    return this.props.objectSummary;
  }
  set objectSummary(value: string | undefined) {
    this.props.objectSummary = value;
    this.touch();
  }
  get organName(): string {
    return this.props.organName;
  }
  get organCnpj(): string | undefined {
    return this.props.organCnpj;
  }
  get organState(): string | undefined {
    return this.props.organState;
  }
  get organCity(): string | undefined {
    return this.props.organCity;
  }
  get estimatedValue(): number | undefined {
    return this.props.estimatedValue;
  }
  get ourProposalValue(): number | undefined {
    return this.props.ourProposalValue;
  }
  set ourProposalValue(value: number | undefined) {
    this.props.ourProposalValue = value;
    this.touch();
  }
  get finalValue(): number | undefined {
    return this.props.finalValue;
  }
  set finalValue(value: number | undefined) {
    this.props.finalValue = value;
    this.touch();
  }
  get margin(): number | undefined {
    return this.props.margin;
  }
  set margin(value: number | undefined) {
    this.props.margin = value;
    this.touch();
  }
  get publicationDate(): Date | undefined {
    return this.props.publicationDate;
  }
  get openingDate(): Date {
    return this.props.openingDate;
  }
  get closingDate(): Date | undefined {
    return this.props.closingDate;
  }
  get disputeDate(): Date | undefined {
    return this.props.disputeDate;
  }
  get status(): BidStatusType {
    return this.props.status;
  }
  set status(value: BidStatusType) {
    this.props.status = value;
    this.touch();
  }
  get viabilityScore(): number | undefined {
    return this.props.viabilityScore;
  }
  set viabilityScore(value: number | undefined) {
    this.props.viabilityScore = value;
    this.touch();
  }
  get viabilityReason(): string | undefined {
    return this.props.viabilityReason;
  }
  set viabilityReason(value: string | undefined) {
    this.props.viabilityReason = value;
    this.touch();
  }
  get customerId(): UniqueEntityID | undefined {
    return this.props.customerId;
  }
  set customerId(value: UniqueEntityID | undefined) {
    this.props.customerId = value;
    this.touch();
  }
  get assignedToUserId(): UniqueEntityID | undefined {
    return this.props.assignedToUserId;
  }
  set assignedToUserId(value: UniqueEntityID | undefined) {
    this.props.assignedToUserId = value;
    this.touch();
  }
  get exclusiveMeEpp(): boolean {
    return this.props.exclusiveMeEpp;
  }
  get deliveryStates(): string[] {
    return this.props.deliveryStates;
  }
  get tags(): string[] {
    return this.props.tags;
  }
  set tags(value: string[]) {
    this.props.tags = value;
    this.touch();
  }
  get notes(): string | undefined {
    return this.props.notes;
  }
  set notes(value: string | undefined) {
    this.props.notes = value;
    this.touch();
  }
  get editalUrl(): string | undefined {
    return this.props.editalUrl;
  }
  get editalFileId(): UniqueEntityID | undefined {
    return this.props.editalFileId;
  }
  get etpFileId(): UniqueEntityID | undefined {
    return this.props.etpFileId;
  }
  get trFileId(): UniqueEntityID | undefined {
    return this.props.trFileId;
  }
  get deletedAt(): Date | undefined {
    return this.props.deletedAt;
  }
  get isDeleted(): boolean {
    return !!this.props.deletedAt;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date | undefined {
    return this.props.updatedAt;
  }

  delete() {
    this.props.deletedAt = new Date();
  }
  private touch() {
    this.props.updatedAt = new Date();
  }

  static create(
    props: Optional<
      BidProps,
      | 'id'
      | 'createdAt'
      | 'status'
      | 'exclusiveMeEpp'
      | 'deliveryStates'
      | 'tags'
    >,
    id?: UniqueEntityID,
  ): Bid {
    return new Bid(
      {
        ...props,
        id: props.id ?? id ?? new UniqueEntityID(),
        status: props.status ?? 'DISCOVERED',
        exclusiveMeEpp: props.exclusiveMeEpp ?? false,
        deliveryStates: props.deliveryStates ?? [],
        tags: props.tags ?? [],
        createdAt: props.createdAt ?? new Date(),
      },
      id,
    );
  }
}
