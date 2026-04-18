/**
 * Prometheus metrics for the notifications module.
 * Import `registerNotificationMetrics(register)` from the main Prometheus
 * plugin to attach these counters to the global registry.
 */

import type { Registry } from 'prom-client';
import { Counter, Gauge, Histogram } from 'prom-client';

export function registerNotificationMetrics(register?: Registry): {
  created: Counter<string>;
  resolved: Counter<string>;
  delivered: Counter<string>;
  deliveryDuration: Histogram<string>;
  socketConnections: Gauge<string>;
  queueDepth: Gauge<string>;
} {
  const opts = register ? { registers: [register] } : {};

  const created = new Counter({
    name: 'notifications_created_total',
    help: 'Total notifications persisted (after preference suppression)',
    labelNames: ['category', 'kind', 'priority', 'tenant'],
    ...opts,
  });

  const resolved = new Counter({
    name: 'notifications_resolved_total',
    help: 'Total actionable/approval notifications resolved',
    labelNames: ['category', 'action', 'state'],
    ...opts,
  });

  const delivered = new Counter({
    name: 'notifications_delivered_total',
    help: 'Total delivery attempts per channel and status',
    labelNames: ['channel', 'status'],
    ...opts,
  });

  const deliveryDuration = new Histogram({
    name: 'notifications_delivery_duration_seconds',
    help: 'Latency of channel delivery',
    labelNames: ['channel'],
    buckets: [0.05, 0.1, 0.25, 0.5, 1, 2, 5, 10],
    ...opts,
  });

  const socketConnections = new Gauge({
    name: 'notifications_socket_connections',
    help: 'Active Socket.IO browser sockets subscribed to notifications',
    ...opts,
  });

  const queueDepth = new Gauge({
    name: 'notifications_queue_depth',
    help: 'Depth of the notifications BullMQ queue',
    labelNames: ['queue'],
    ...opts,
  });

  return {
    created,
    resolved,
    delivered,
    deliveryDuration,
    socketConnections,
    queueDepth,
  };
}
