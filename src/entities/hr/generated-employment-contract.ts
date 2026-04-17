import { Entity } from '../domain/entities';
import { UniqueEntityID } from '../domain/unique-entity-id';

export interface GeneratedEmploymentContractProps {
  tenantId: UniqueEntityID;
  templateId: UniqueEntityID;
  employeeId: UniqueEntityID;
  generatedBy: UniqueEntityID;
  storageFileId?: UniqueEntityID;
  pdfUrl?: string;
  pdfKey?: string;
  variables: Record<string, unknown>;
  signatureEnvelopeId?: string | null;
  createdAt: Date;
}

export class GeneratedEmploymentContract extends Entity<GeneratedEmploymentContractProps> {
  get tenantId(): UniqueEntityID {
    return this.props.tenantId;
  }

  get templateId(): UniqueEntityID {
    return this.props.templateId;
  }

  get employeeId(): UniqueEntityID {
    return this.props.employeeId;
  }

  get generatedBy(): UniqueEntityID {
    return this.props.generatedBy;
  }

  get storageFileId(): UniqueEntityID | undefined {
    return this.props.storageFileId;
  }

  get pdfUrl(): string | undefined {
    return this.props.pdfUrl;
  }

  get pdfKey(): string | undefined {
    return this.props.pdfKey;
  }

  get variables(): Record<string, unknown> {
    return this.props.variables;
  }

  get signatureEnvelopeId(): string | null | undefined {
    return this.props.signatureEnvelopeId;
  }

  set signatureEnvelopeId(value: string | null | undefined) {
    this.props.signatureEnvelopeId = value;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  attachPdf(params: {
    pdfUrl: string;
    pdfKey: string;
    storageFileId?: UniqueEntityID;
  }): void {
    this.props.pdfUrl = params.pdfUrl;
    this.props.pdfKey = params.pdfKey;
    if (params.storageFileId) {
      this.props.storageFileId = params.storageFileId;
    }
  }

  attachStorageFile(storageFileId: UniqueEntityID): void {
    this.props.storageFileId = storageFileId;
  }

  private constructor(
    props: GeneratedEmploymentContractProps,
    id?: UniqueEntityID,
  ) {
    super(props, id);
  }

  static create(
    props: Omit<GeneratedEmploymentContractProps, 'createdAt'> & {
      createdAt?: Date;
    },
    id?: UniqueEntityID,
  ): GeneratedEmploymentContract {
    return new GeneratedEmploymentContract(
      {
        ...props,
        variables: props.variables ?? {},
        createdAt: props.createdAt ?? new Date(),
      },
      id,
    );
  }
}
