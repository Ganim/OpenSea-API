import { env } from '@/@env';
import { PrismaEmailAccountsRepository } from '@/repositories/email/prisma/prisma-email-accounts-repository';
import { PrismaEmailMessagesRepository } from '@/repositories/email/prisma/prisma-email-messages-repository';
import { LocalFileUploadService } from '@/services/storage/local-file-upload-service';
import { S3FileUploadService } from '@/services/storage/s3-file-upload-service';
import { GetEmailAttachmentDownloadUrlUseCase } from '../get-email-attachment-download-url';

export function makeGetEmailAttachmentDownloadUrlUseCase() {
  const fileUploadService = env.S3_ENDPOINT
    ? new S3FileUploadService()
    : new LocalFileUploadService();

  return new GetEmailAttachmentDownloadUrlUseCase(
    new PrismaEmailAccountsRepository(),
    new PrismaEmailMessagesRepository(),
    fileUploadService,
  );
}
