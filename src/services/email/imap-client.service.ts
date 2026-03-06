import { logger } from '@/lib/logger';
import { ImapFlow } from 'imapflow';

export interface ImapConnectionConfig {
  host: string;
  port: number;
  secure: boolean;
  username: string;
  secret: string;
}

/**
 * Cria um ImapFlow com handler de 'error' registrado imediatamente.
 *
 * ImapFlow é um EventEmitter — se o socket cair depois de connect() mas antes
 * de logout(), ele emite um evento 'error'. Sem listener, o Node.js converte
 * isso em uncaughtException, o que derruba o processo inteiro.
 *
 * Use esta factory em TODO lugar que precise de um cliente IMAP.
 */
export function createImapClient(config: {
  host: string;
  port: number;
  secure: boolean;
  username: string;
  secret: string;
}): ImapFlow {
  const client = new ImapFlow({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.username,
      pass: config.secret,
    },
    logger: false,
    tls: {
      // cPanel/HostGator shared hosting uses certificates issued for the
      // server hostname, not the custom domain.  Without this, ImapFlow
      // rejects the TLS handshake on hostname mismatch.
      rejectUnauthorized: false,
    },
    // Prevent zombie connections on unreliable mail servers
    connectionTimeout: 30_000,  // 30s to establish TCP connection
    greetingTimeout: 30_000,    // 30s for server greeting
    socketTimeout: 120_000,     // 2min inactivity before closing
  });

  // Absorve erros assíncronos do socket (drop de conexão, timeout do servidor, etc.)
  // para que não se tornem uncaughtException → process crash.
  client.on('error', (err: Error) => {
    logger.warn({ err, host: config.host }, 'ImapFlow socket error (handled)');
  });

  return client;
}

export class ImapClientService {
  async testConnection(config: ImapConnectionConfig): Promise<void> {
    if (process.env.NODE_ENV === 'test') {
      return;
    }

    const client = createImapClient(config);

    try {
      await client.connect();
    } finally {
      await client.logout().catch(() => undefined);
    }
  }
}
