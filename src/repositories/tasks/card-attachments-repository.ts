export interface CardAttachmentRecord {
  id: string;
  cardId: string;
  fileId: string;
  addedBy: string;
  createdAt: Date;
  fileName?: string | null;
  fileMimeType?: string | null;
  fileSizeBytes?: number | null;
}

export interface CreateCardAttachmentSchema {
  cardId: string;
  fileId: string;
  addedBy: string;
}

export interface CardAttachmentsRepository {
  create(data: CreateCardAttachmentSchema): Promise<CardAttachmentRecord>;
  findById(id: string, cardId: string): Promise<CardAttachmentRecord | null>;
  findByCardId(cardId: string): Promise<CardAttachmentRecord[]>;
  delete(id: string, cardId: string): Promise<void>;
}
