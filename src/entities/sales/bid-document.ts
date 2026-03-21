import { Entity } from '../domain/entities';
import type { Optional } from '../domain/optional';
import { UniqueEntityID } from '../domain/unique-entity-id';

export type BidDocumentTypeEnum = 'CERTIDAO_FEDERAL' | 'CERTIDAO_ESTADUAL' | 'CERTIDAO_MUNICIPAL' | 'CERTIDAO_TRABALHISTA' | 'CERTIDAO_FGTS' | 'CERTIDAO_FALENCIA' | 'BALANCO_PATRIMONIAL' | 'CONTRATO_SOCIAL' | 'ALVARA' | 'ATESTADO_CAPACIDADE' | 'PROPOSTA_TECNICA' | 'PROPOSTA_COMERCIAL' | 'EDITAL' | 'ATA_REGISTRO' | 'OUTROS';
export type BidDocRenewalStatusType = 'SUCCESS' | 'FAILED' | 'PENDING_RENEWAL' | 'NOT_APPLICABLE';

export interface BidDocumentProps {
  id: UniqueEntityID;
  tenantId: UniqueEntityID;
  bidId?: UniqueEntityID;
  type: BidDocumentTypeEnum;
  name: string;
  description?: string;
  fileId: UniqueEntityID;
  issueDate?: Date;
  expirationDate?: Date;
  isValid: boolean;
  autoRenewable: boolean;
  lastRenewAttempt?: Date;
  renewStatus?: BidDocRenewalStatusType;
  portalUploaded: boolean;
  portalUploadedAt?: Date;
  createdAt: Date;
  updatedAt?: Date;
}

export class BidDocument extends Entity<BidDocumentProps> {
  get tenantId(): UniqueEntityID { return this.props.tenantId; }
  get bidId(): UniqueEntityID | undefined { return this.props.bidId; }
  get type(): BidDocumentTypeEnum { return this.props.type; }
  get name(): string { return this.props.name; }
  get description(): string | undefined { return this.props.description; }
  get fileId(): UniqueEntityID { return this.props.fileId; }
  get issueDate(): Date | undefined { return this.props.issueDate; }
  get expirationDate(): Date | undefined { return this.props.expirationDate; }
  get isValid(): boolean { return this.props.isValid; }
  set isValid(value: boolean) { this.props.isValid = value; this.props.updatedAt = new Date(); }
  get autoRenewable(): boolean { return this.props.autoRenewable; }
  get lastRenewAttempt(): Date | undefined { return this.props.lastRenewAttempt; }
  get renewStatus(): BidDocRenewalStatusType | undefined { return this.props.renewStatus; }
  get portalUploaded(): boolean { return this.props.portalUploaded; }
  get portalUploadedAt(): Date | undefined { return this.props.portalUploadedAt; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date | undefined { return this.props.updatedAt; }

  static create(props: Optional<BidDocumentProps, 'id' | 'createdAt' | 'isValid' | 'autoRenewable' | 'portalUploaded'>, id?: UniqueEntityID): BidDocument {
    return new BidDocument({ ...props, id: props.id ?? id ?? new UniqueEntityID(), isValid: props.isValid ?? true, autoRenewable: props.autoRenewable ?? false, portalUploaded: props.portalUploaded ?? false, createdAt: props.createdAt ?? new Date() }, id);
  }
}
