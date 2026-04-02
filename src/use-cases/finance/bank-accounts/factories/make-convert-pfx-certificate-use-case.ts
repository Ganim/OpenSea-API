import { S3FileUploadService } from '@/services/storage/s3-file-upload-service';
import { ConvertPfxCertificateUseCase } from '../convert-pfx-certificate';

export function makeConvertPfxCertificateUseCase() {
  const s3 = S3FileUploadService.getInstance();
  return new ConvertPfxCertificateUseCase(s3);
}
