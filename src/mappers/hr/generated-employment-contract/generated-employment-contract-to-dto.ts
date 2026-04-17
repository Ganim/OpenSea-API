import type { GeneratedEmploymentContract } from '@/entities/hr/generated-employment-contract';

export interface GeneratedEmploymentContractDTO {
  id: string;
  templateId: string;
  employeeId: string;
  generatedBy: string;
  storageFileId: string | null;
  pdfUrl: string | null;
  pdfKey: string | null;
  variables: Record<string, unknown>;
  signatureEnvelopeId: string | null;
  createdAt: Date;
}

export function generatedEmploymentContractToDTO(
  contract: GeneratedEmploymentContract,
): GeneratedEmploymentContractDTO {
  return {
    id: contract.id.toString(),
    templateId: contract.templateId.toString(),
    employeeId: contract.employeeId.toString(),
    generatedBy: contract.generatedBy.toString(),
    storageFileId: contract.storageFileId?.toString() ?? null,
    pdfUrl: contract.pdfUrl ?? null,
    pdfKey: contract.pdfKey ?? null,
    variables: contract.variables,
    signatureEnvelopeId: contract.signatureEnvelopeId ?? null,
    createdAt: contract.createdAt,
  };
}
