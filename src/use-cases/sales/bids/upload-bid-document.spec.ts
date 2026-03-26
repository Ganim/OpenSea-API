import { beforeEach, describe, expect, it } from 'vitest';
import { UploadBidDocumentUseCase } from './upload-bid-document';

let sut: UploadBidDocumentUseCase;

describe('UploadBidDocumentUseCase', () => {
  beforeEach(() => {
    sut = new UploadBidDocumentUseCase();
  });

  it('should throw not implemented error', async () => {
    await expect(() => sut.execute({})).rejects.toThrow(
      'UploadBidDocumentUseCase not implemented',
    );
  });
});
