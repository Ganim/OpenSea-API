export interface AgentPrinterInfo {
  name: string;
  status: 'ONLINE' | 'OFFLINE' | 'ERROR';
  isDefault: boolean;
  portName?: string;
  driverName?: string;
}

export interface AgentRegisterPayload {
  hostname: string;
  os: {
    platform: string;
    arch: string;
    version: string;
    nodeVersion: string;
  };
  agentVersion: string;
  printers: AgentPrinterInfo[];
}

export interface AgentHeartbeatPayload {
  printers: AgentPrinterInfo[];
}

export interface AgentJobStatusPayload {
  jobId: string;
  status: 'PRINTING' | 'SUCCESS' | 'FAILED';
  error?: string;
}

export interface JobNewPayload {
  jobId: string;
  type: 'LABEL' | 'RECEIPT' | 'DOCUMENT';
  content: string;
  printerName: string;
  copies: number;
}

export interface JobCancelPayload {
  jobId: string;
}

export interface PrinterStatusPayload {
  printerId: string;
  printerName: string;
  status: 'ONLINE' | 'OFFLINE' | 'BUSY' | 'ERROR';
  agentName: string;
  agentId: string;
  lastSeenAt: string | null;
}

export interface JobUpdatePayload {
  jobId: string;
  status: 'QUEUED' | 'PRINTING' | 'SUCCESS' | 'FAILED' | 'CANCELLED';
  completedAt?: string;
  error?: string;
}

export interface SocketData {
  type: 'browser' | 'agent' | 'punch-agent';
  tenantId: string;
  userId?: string;
  agentId?: string;
  /** deviceId for punch-agent sockets (Phase 10 / Plan 10-01 — D-D1) */
  deviceId?: string;
}
