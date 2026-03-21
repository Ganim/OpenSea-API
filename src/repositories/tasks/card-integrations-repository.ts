export interface CardIntegrationRecord {
  id: string;
  cardId: string;
  type: string;
  entityId: string;
  entityLabel: string;
  createdBy: string;
  createdAt: Date;
}

export interface CreateCardIntegrationData {
  cardId: string;
  type: string;
  entityId: string;
  entityLabel: string;
  createdBy: string;
}

export interface CardIntegrationsRepository {
  create(data: CreateCardIntegrationData): Promise<CardIntegrationRecord>;
  delete(id: string): Promise<void>;
  findById(id: string): Promise<CardIntegrationRecord | null>;
  findByCardId(cardId: string): Promise<CardIntegrationRecord[]>;
  findByCardAndEntity(
    cardId: string,
    type: string,
    entityId: string,
  ): Promise<CardIntegrationRecord | null>;
}
