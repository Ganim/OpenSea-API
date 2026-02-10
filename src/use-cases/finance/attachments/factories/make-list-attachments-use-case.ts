import { env } from '@/@env';
import { PrismaFinanceAttachmentsRepository } from '@/repositories/finance/prisma/prisma-finance-attachments-repository';
import { PrismaFinanceEntriesRepository } from '@/repositories/finance/prisma/prisma-finance-entries-repository';
import { LocalFileUploadService } from '@/services/storage/local-file-upload-service';
import { S3FileUploadService } from '@/services/storage/s3-file-upload-service';
import { ListAttachmentsUseCase } from '../list-attachments';

export function makeListAttachmentsUseCase() {
  const entriesRepository = new PrismaFinanceEntriesRepository();
  const attachmentsRepository = new PrismaFinanceAttachmentsRepository();
  const fileUploadService = env.S3_ENDPOINT
    ? new S3FileUploadService()
    : new LocalFileUploadService();

  return new ListAttachmentsUseCase(
    entriesRepository,
    attachmentsRepository,
    fileUploadService,
  );
}
