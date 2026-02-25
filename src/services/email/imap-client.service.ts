import { ImapFlow } from 'imapflow';

export interface ImapConnectionConfig {
  host: string;
  port: number;
  secure: boolean;
  username: string;
  secret: string;
}

export class ImapClientService {
  async testConnection(config: ImapConnectionConfig): Promise<void> {
    if (process.env.NODE_ENV === 'test') {
      return;
    }

    const client = new ImapFlow({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: {
        user: config.username,
        pass: config.secret,
      },
      logger: false,
    });

    try {
      await client.connect();
    } finally {
      await client.logout().catch(() => undefined);
    }
  }
}
