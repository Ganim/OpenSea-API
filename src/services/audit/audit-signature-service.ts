import { createHmac, timingSafeEqual } from 'crypto';
import { env } from '@/@env';

/**
 * Dados usados para gerar a assinatura do audit log
 */
interface AuditLogSignatureData {
  userId: string | null;
  action: string;
  entity: string;
  entityId: string;
  module: string;
  oldData?: unknown;
  newData?: unknown;
  metadata?: unknown;
  createdAt: Date;
}

/**
 * Serviço para assinatura e verificação de integridade de audit logs
 *
 * Usa HMAC-SHA256 para garantir que os logs não foram adulterados.
 * A assinatura é baseada em todos os campos relevantes do log.
 */
export class AuditSignatureService {
  private readonly hmacSecret: string;

  constructor() {
    // Usa uma variável de ambiente específica ou deriva do JWT_SECRET
    this.hmacSecret =
      process.env.AUDIT_HMAC_SECRET || env.JWT_SECRET + '-audit';
  }

  /**
   * Gera uma assinatura HMAC-SHA256 para um audit log
   */
  generateSignature(data: AuditLogSignatureData): string {
    const payload = this.normalizePayload(data);
    return createHmac('sha256', this.hmacSecret).update(payload).digest('hex');
  }

  /**
   * Verifica se a assinatura de um audit log é válida
   *
   * Usa timing-safe comparison para prevenir timing attacks
   */
  verifySignature(data: AuditLogSignatureData, signature: string): boolean {
    const expectedSignature = this.generateSignature(data);

    // Converte para buffers para comparação segura
    const sigBuffer = Buffer.from(signature, 'hex');
    const expectedBuffer = Buffer.from(expectedSignature, 'hex');

    // Verifica se têm o mesmo tamanho antes de comparar
    if (sigBuffer.length !== expectedBuffer.length) {
      return false;
    }

    return timingSafeEqual(sigBuffer, expectedBuffer);
  }

  /**
   * Normaliza o payload para garantir consistência na assinatura
   *
   * A ordem das chaves e formatação de datas são normalizadas
   * para garantir que a mesma entrada sempre gere a mesma assinatura.
   */
  private normalizePayload(data: AuditLogSignatureData): string {
    const normalized = {
      userId: data.userId,
      action: data.action,
      entity: data.entity,
      entityId: data.entityId,
      module: data.module,
      oldData: data.oldData ? this.sortObjectKeys(data.oldData) : null,
      newData: data.newData ? this.sortObjectKeys(data.newData) : null,
      metadata: data.metadata ? this.sortObjectKeys(data.metadata) : null,
      createdAt: data.createdAt.toISOString(),
    };

    return JSON.stringify(normalized);
  }

  /**
   * Ordena as chaves de um objeto recursivamente
   * para garantir serialização consistente
   */
  private sortObjectKeys(obj: unknown): unknown {
    if (obj === null || obj === undefined) {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map((item) => this.sortObjectKeys(item));
    }

    if (typeof obj === 'object' && obj !== null) {
      const sorted: Record<string, unknown> = {};
      const keys = Object.keys(obj as Record<string, unknown>).sort();

      for (const key of keys) {
        sorted[key] = this.sortObjectKeys(
          (obj as Record<string, unknown>)[key],
        );
      }

      return sorted;
    }

    return obj;
  }
}

// Singleton instance
let instance: AuditSignatureService | null = null;

export function getAuditSignatureService(): AuditSignatureService {
  if (!instance) {
    instance = new AuditSignatureService();
  }
  return instance;
}

/**
 * Verifica a integridade de uma lista de audit logs
 *
 * @param logs - Lista de logs com suas assinaturas
 * @returns Objeto com resultado e lista de IDs inválidos
 */
export async function verifyAuditLogChain(
  logs: Array<{
    id: string;
    userId: string | null;
    action: string;
    entity: string;
    entityId: string;
    module: string;
    oldData?: unknown;
    newData?: unknown;
    metadata?: unknown;
    createdAt: Date;
    signature: string;
  }>,
): Promise<{
  valid: boolean;
  invalidLogIds: string[];
  totalChecked: number;
}> {
  const service = getAuditSignatureService();
  const invalidLogIds: string[] = [];

  for (const log of logs) {
    const isValid = service.verifySignature(
      {
        userId: log.userId,
        action: log.action,
        entity: log.entity,
        entityId: log.entityId,
        module: log.module,
        oldData: log.oldData,
        newData: log.newData,
        metadata: log.metadata,
        createdAt: log.createdAt,
      },
      log.signature,
    );

    if (!isValid) {
      invalidLogIds.push(log.id);
    }
  }

  return {
    valid: invalidLogIds.length === 0,
    invalidLogIds,
    totalChecked: logs.length,
  };
}
