import type { WebSocket } from 'ws';

/**
 * In-memory registry of active print-agent WebSocket connections.
 *
 * Each paired print agent maintains a single WebSocket connection.
 * The map key is the agent's database CUID; the value is the raw
 * WebSocket instance from @fastify/websocket.
 *
 * This registry is the single source of truth for "which agents are
 * connected right now" and is used by the print-queue system to
 * dispatch print commands to specific agents.
 */

const activeAgentConnections = new Map<string, WebSocket>();

/** Store a connection for a paired print agent. */
export function registerAgentConnection(
  agentId: string,
  socket: WebSocket,
): void {
  // If this agent already had a connection (e.g. reconnect race), close the old one.
  const existing = activeAgentConnections.get(agentId);
  if (existing && existing.readyState === existing.OPEN) {
    existing.close(4000, 'Replaced by new connection');
  }
  activeAgentConnections.set(agentId, socket);
}

/** Remove a connection when an agent disconnects. */
export function unregisterAgentConnection(agentId: string): void {
  activeAgentConnections.delete(agentId);
}

/** Get the WebSocket for a specific agent (or undefined if offline). */
export function getAgentConnection(agentId: string): WebSocket | undefined {
  return activeAgentConnections.get(agentId);
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
  const socket = activeAgentConnections.get(agentId);
  if (!socket || socket.readyState !== socket.OPEN) {
    return false;
  }

  socket.send(JSON.stringify(message));
  return true;
}

/** Check whether a specific agent has an active connection. */
export function isAgentConnected(agentId: string): boolean {
  const socket = activeAgentConnections.get(agentId);
  return socket !== undefined && socket.readyState === socket.OPEN;
}

/** Return the number of currently connected agents (for monitoring). */
export function getConnectedAgentCount(): number {
  return activeAgentConnections.size;
}
