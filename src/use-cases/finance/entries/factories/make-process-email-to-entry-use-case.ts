import { CredentialCipherService } from '@/services/email/credential-cipher.service';
import { OcrExtractDataUseCase } from '../ocr-extract-data';
import { ProcessEmailToEntryUseCase } from '../process-email-to-entry';
import { makeCreateFinanceEntryUseCase } from './make-create-finance-entry-use-case';

export function makeProcessEmailToEntryUseCase() {
  const ocrExtractDataUseCase = new OcrExtractDataUseCase();
  const createFinanceEntryUseCase = makeCreateFinanceEntryUseCase();
  const credentialCipherService = new CredentialCipherService();

  return new ProcessEmailToEntryUseCase(
    ocrExtractDataUseCase,
    createFinanceEntryUseCase,
    credentialCipherService,
  );
}
