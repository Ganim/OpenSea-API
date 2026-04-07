import { register } from '@/http/plugins/prometheus.plugin';
import { Counter, Gauge, Histogram } from 'prom-client';

// ─── Authentication Metrics ────────────────────────────────────────────────
export const authLoginTotal = new Counter({
  name: 'auth_login_total',
  help: 'Total login attempts',
  labelNames: ['status'] as const, // success, failure, blocked
  registers: [register],
});

export const authTokenRefreshTotal = new Counter({
  name: 'auth_token_refresh_total',
  help: 'Total token refresh attempts',
  labelNames: ['status'] as const, // success, reuse_detected, expired
  registers: [register],
});

// ─── Queue Metrics ─────────────────────────────────────────────────────────
export const queueJobDuration = new Histogram({
  name: 'queue_job_duration_seconds',
  help: 'Duration of queue job processing',
  labelNames: ['queue', 'status'] as const,
  buckets: [0.1, 0.5, 1, 5, 10, 30, 60],
  registers: [register],
});

export const queueJobTotal = new Counter({
  name: 'queue_jobs_total',
  help: 'Total queue jobs processed',
  labelNames: ['queue', 'status'] as const,
  registers: [register],
});

export const queueDepth = new Gauge({
  name: 'queue_depth',
  help: 'Current number of waiting jobs per queue',
  labelNames: ['queue'] as const,
  registers: [register],
});

// ─── Database Metrics ──────────────────────────────────────────────────────
export const dbQueryDuration = new Histogram({
  name: 'db_query_duration_seconds',
  help: 'Duration of database queries',
  labelNames: ['operation'] as const, // findMany, create, update, delete
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 5],
  registers: [register],
});

// ─── Business Metrics ──────────────────────────────────────────────────────
export const storageUploadTotal = new Counter({
  name: 'storage_uploads_total',
  help: 'Total file uploads',
  labelNames: ['tenant'] as const,
  registers: [register],
});

export const storageUploadSize = new Histogram({
  name: 'storage_upload_size_bytes',
  help: 'Size of uploaded files',
  labelNames: ['tenant'] as const,
  buckets: [1024, 10240, 102400, 1048576, 10485760, 26214400], // 1KB to 25MB
  registers: [register],
});

export const paymentReconciliationRunsTotal = new Counter({
  name: 'payment_reconciliation_runs_total',
  help: 'Total payment reconciliation runs per tenant and status',
  labelNames: ['tenant', 'success'] as const,
  registers: [register],
});

export const paymentReconciliationChargesTotal = new Counter({
  name: 'payment_reconciliation_charges_total',
  help: 'Total reconciled payment charges by resulting status',
  labelNames: ['tenant', 'status'] as const,
  registers: [register],
});

export const paymentReconciliationDurationSeconds = new Histogram({
  name: 'payment_reconciliation_duration_seconds',
  help: 'Duration of payment reconciliation run in seconds',
  labelNames: ['tenant', 'success'] as const,
  buckets: [0.1, 0.5, 1, 2, 5, 10, 30, 60, 120],
  registers: [register],
});
