export interface UploadResult {
  key: string;
  url: string;
  size: number;
  mimeType: string;
}

export interface UploadOptions {
  prefix: string;
  maxSize?: number; // bytes, default 10MB
  allowedTypes?: string[];
}

export interface MultipartUploadInit {
  uploadId: string;
  key: string;
}

export interface MultipartPartUrl {
  partNumber: number;
  url: string;
}

export interface MultipartCompletePart {
  partNumber: number;
  etag: string;
}

export interface UploadWithKeyOptions {
  mimeType: string;
  cacheControl?: string;
  metadata?: Record<string, string>;
}

export interface UploadWithKeyResult {
  key: string;
  bucket: string;
  etag?: string;
  size: number;
}

/**
 * Metadata retornada por `headObject` — subset mínimo para validar a
 * existência de um objeto e confirmar o tamanho declarado pelo client.
 *
 * Phase 7 / Plan 07-03 — D-10 (S3 headObject validation / Warning #7).
 */
export interface HeadObjectResult {
  contentLength: number;
  contentType: string;
}

export interface FileUploadService {
  upload(
    fileBuffer: Buffer,
    fileName: string,
    mimeType: string,
    options: UploadOptions,
  ): Promise<UploadResult>;

  /**
   * PUT with a caller-provided key (no UUID prefix, no sanitization of path
   * segments — the caller is responsible for deterministic key construction).
   *
   * Used by compliance flows (Phase 06) where `storageKey` must match the
   * deterministic pattern `{tenant}/compliance/{artifactType}/{YYYY}/{MM}/{id}.txt`
   * so that the generated `ComplianceArtifact.storageKey` column stays in
   * sync with the blob location. Does NOT compress the body (compliance
   * artifacts are already compact and must match the byte-for-byte hash
   * recorded in `ComplianceArtifact.contentHash`).
   */
  uploadWithKey(
    fileBuffer: Buffer,
    key: string,
    options: UploadWithKeyOptions,
  ): Promise<UploadWithKeyResult>;

  /**
   * Presigned URL for a GET download.
   *
   * `responseContentDisposition` (Phase 06 / Plan 06-06): optional — appended
   * to the signed URL as `response-content-disposition` query param, causing
   * R2/S3 to serve the blob with the specified Content-Disposition header
   * (e.g. `attachment; filename="AFD_12345678000190_20260301_20260331.txt"`).
   * The presigned URL signature covers this param, so browsers cannot tamper
   * with the filename via query string manipulation.
   */
  getPresignedUrl(
    key: string,
    expiresIn?: number,
    responseContentDisposition?: string,
  ): Promise<string>;

  getObject(key: string): Promise<Buffer>;

  /**
   * HEAD request — retorna metadata do objeto sem baixar o corpo.
   * `null` se o objeto não existe. Usado pelo `ResolvePunchApprovalUseCase`
   * (Phase 7 / Plan 07-03 — D-10) para validar que uma `evidenceFileKey`
   * enviada pelo client realmente existe no bucket antes de anexá-la ao
   * PunchApproval (Warning #7: defesa contra phantom keys).
   */
  headObject(key: string): Promise<HeadObjectResult | null>;

  delete(key: string): Promise<void>;

  // Multipart upload (for files > 50MB)
  initiateMultipartUpload(
    fileName: string,
    mimeType: string,
    options: UploadOptions,
  ): Promise<MultipartUploadInit>;

  getPresignedPartUrls(
    key: string,
    uploadId: string,
    totalParts: number,
  ): Promise<MultipartPartUrl[]>;

  completeMultipartUpload(
    key: string,
    uploadId: string,
    parts: MultipartCompletePart[],
  ): Promise<UploadResult>;

  abortMultipartUpload(key: string, uploadId: string): Promise<void>;
}
