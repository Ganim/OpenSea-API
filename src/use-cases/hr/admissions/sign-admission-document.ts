import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import type {
  AdmissionsRepository,
  DigitalSignatureRecord,
} from '@/repositories/hr/admissions-repository';

export interface SignAdmissionDocumentRequest {
  token: string;
  signerName: string;
  signerCpf?: string;
  signerEmail?: string;
  ipAddress: string;
  userAgent: string;
  documentHash: string;
  signatureType: string;
  documentId?: string;
}

export interface SignAdmissionDocumentResponse {
  signature: DigitalSignatureRecord;
}

const VALID_SIGNATURE_TYPES = [
  'ADMISSION_CONTRACT',
  'DOCUMENT_ACKNOWLEDGMENT',
  'POLICY_ACCEPTANCE',
];

export class SignAdmissionDocumentUseCase {
  constructor(private admissionsRepository: AdmissionsRepository) {}

  async execute(
    request: SignAdmissionDocumentRequest,
  ): Promise<SignAdmissionDocumentResponse> {
    const {
      token,
      signerName,
      signerCpf,
      signerEmail,
      ipAddress,
      userAgent,
      documentHash,
      signatureType,
      documentId,
    } = request;

    if (!VALID_SIGNATURE_TYPES.includes(signatureType)) {
      throw new BadRequestError(`Invalid signature type: ${signatureType}`);
    }

    const invite = await this.admissionsRepository.findByToken(token);

    if (!invite) {
      throw new ResourceNotFoundError('Admission invite not found');
    }

    if (invite.status === 'CANCELLED') {
      throw new BadRequestError('This admission invite has been cancelled');
    }

    if (invite.status === 'COMPLETED') {
      throw new BadRequestError('This admission has already been completed');
    }

    if (invite.expiresAt && new Date() > invite.expiresAt) {
      throw new BadRequestError('This admission invite has expired');
    }

    const signature = await this.admissionsRepository.createSignature({
      tenantId: invite.tenantId,
      admissionInviteId: invite.id,
      documentId,
      signerName,
      signerCpf,
      signerEmail,
      ipAddress,
      userAgent,
      documentHash,
      signatureType,
    });

    return { signature };
  }
}
