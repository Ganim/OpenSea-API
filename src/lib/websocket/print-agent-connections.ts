import type { WebSocket } from 'ws';

/**
 * In-memory registry of active print-agent WebSocket connections.
 *
 * Each paired print agent maintains a single WebSocket connection.
 * The map key is the agent's database CUID; the value tracks the raw
 * WebSocket instance from @fastify/websocket plus the tenant the agent
 * belongs to (so we can broadcast to "all PrintServers of tenant X"
 * without hitting the database on every dispatch).
 *
 * This registry is the single source of truth for "which agents are
 * connected right now" and is used by the print-queue system to
 * dispatch print commands to specific agents.
 */

interface ActiveAgentConnection {
  socket: WebSocket;
  tenantId?: string;
}

const activeAgentConnections = new Map<string, ActiveAgentConnection>();

/**
 * Store a connection for a paired print agent.
 *
 * `tenantId` is optional for backwards compatibility with the legacy
 * call sites that did not enrich the registry with tenant information,
 * but new callers SHOULD always pass it so tenant-scoped broadcasts
 * work correctly.
 */
export function registerAgentConnection(
  agentId: string,
  socket: WebSocket,
  tenantId?: string,
): void {
  // If this agent already had a connection (e.g. reconnect race), close the old one.
  const existing = activeAgentConnections.get(agentId);
  if (existing && existing.socket.readyState === existing.socket.OPEN) {
    existing.socket.close(4000, 'Replaced by new connection');
  }
  activeAgentConnections.set(agentId, { socket, tenantId });
}

/** Remove a connection when an agent disconnects. */
export function unregisterAgentConnection(agentId: string): void {
  activeAgentConnections.delete(agentId);
}

/** Get the WebSocket for a specific agent (or undefined if offline). */
export function getAgentConnection(agentId: string): WebSocket | undefined {
  return activeAgentConnections.get(agentId)?.socket;
}

/**
 * Send a JSON message to a specific print agent.
 *
 * Returns `true` if the message was sent, `false` if the agent is
 * not connected or the socket is not in OPEN state.
 */
export function sendMessageToAgent(
  agentId: string,
  message: Record<string, unknown>,
): boolean {
  const connection = activeAgentConnections.get(agentId);
  if (!connection || connection.socket.readyState !== connection.socket.OPEN) {
    return false;
  }

  connection.socket.send(JSON.stringify(message));
  return true;
}

/** Check whether a specific agent has an active connection. */
export function isAgentConnected(agentId: string): boolean {
  const connection = activeAgentConnections.get(agentId);
  return (
    connection !== undefined &&
    connection.socket.readyState === connection.socket.OPEN
  );
}

/** Return the number of currently connected agents (for monitoring). */
export function getConnectedAgentCount(): number {
  return activeAgentConnections.size;
}

/**
 * Broadcast a JSON message to every print agent (PrintServer instance)
 * connected for the given tenant.
 *
 * Each tenant may pair multiple PrintServer hosts (e.g. one per shop
 * floor or one per workstation). For now we deliver the same command
 * to every connected PrintServer of the tenant; the PrintServer itself
 * decides whether it owns `printerId` and ignores the command otherwise.
 *
 * Returns `true` if AT LEAST ONE agent received the message, `false`
 * if no agent is online for the tenant (or every socket is in a
 * non-OPEN state).
 */
export function broadcastToPrintServer(
  tenantId: string,
  message: Record<string, unknown>,
): boolean {
  let delivered = false;
  const serialized = JSON.stringify(message);

  for (const connection of activeAgentConnections.values()) {
    if (connection.tenantId !== tenantId) continue;
    if (connection.socket.readyState !== connection.socket.OPEN) continue;
    connection.socket.send(serialized);
    delivered = true;
  }

  return delivered;
}

/**
 * Test/cleanup helper: forcibly remove every tracked connection without
 * closing the underlying sockets. Intended only for spec teardown.
 */
export function clearAgentConnectionsForTesting(): void {
  activeAgentConnections.clear();
}
