import { Entity } from '../domain/entities';
import type { Optional } from '../domain/optional';
import { UniqueEntityID } from '../domain/unique-entity-id';

/**
 * Resultado da consulta pública (Plan 06-03 — rota /v1/public/punch/verify).
 *
 * - `FOUND`        — nsrHash bate com um TimeEntry; dados retornados.
 * - `NOT_FOUND`    — hash inexistente; retorna 404 ao público.
 * - `RATE_LIMITED` — IP excedeu 30/min; bloqueado pelo Fastify rate-limit.
 *
 * Mantido em sync com o constraint VARCHAR(16) na coluna `hit_result`.
 */
export type ComplianceVerifyHitResult = 'FOUND' | 'NOT_FOUND' | 'RATE_LIMITED';

export interface ComplianceVerifyLogProps {
  /** Hash HMAC do par (tenantId, nsrNumber). Indexed para detecção de abuse. */
  nsrHash: string;
  /** Tenant resolvido — apenas em FOUND. NULL em NOT_FOUND/RATE_LIMITED. */
  tenantId?: UniqueEntityID;
  timeEntryId?: UniqueEntityID;
  ipAddress?: string;
  userAgent?: string;
  accessedAt: Date;
  hitResult: ComplianceVerifyHitResult;
}

/**
 * Log de consultas à rota pública de verificação de recibo (Plan 06-03).
 *
 * Modelo intencionalmente sem relação forte com Tenant/TimeEntry — uma
 * consulta com hash inválido vinda de IP desconhecido não pode quebrar
 * por FK. Dados servem para detecção de abuse / audit forense.
 *
 * Não tem mutações depois do create. Apenas factory + getters.
 */
export class ComplianceVerifyLog extends Entity<ComplianceVerifyLogProps> {
  get nsrHash() {
    return this.props.nsrHash;
  }

  get tenantId() {
    return this.props.tenantId;
  }

  get timeEntryId() {
    return this.props.timeEntryId;
  }

  get ipAddress() {
    return this.props.ipAddress;
  }

  get userAgent() {
    return this.props.userAgent;
  }

  get accessedAt() {
    return this.props.accessedAt;
  }

  get hitResult() {
    return this.props.hitResult;
  }

  static create(
    props: Optional<ComplianceVerifyLogProps, 'accessedAt'>,
    id?: UniqueEntityID,
  ) {
    return new ComplianceVerifyLog(
      {
        ...props,
        accessedAt: props.accessedAt ?? new Date(),
      },
      id,
    );
  }
}
