interface SystemHealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  uptime: number;
  timestamp: Date;
  services: {
    api: { status: string; uptime: number };
    database: { status: string; latencyMs: number };
    redis: { status: string; latencyMs: number };
  };
}

interface GetSystemHealthUseCaseResponse {
  health: SystemHealthStatus;
}

export class GetSystemHealthUseCase {
  private readonly startedAt = Date.now();

  async execute(): Promise<GetSystemHealthUseCaseResponse> {
    const uptimeMs = Date.now() - this.startedAt;

    // Placeholder values — real health checks would ping DB/Redis
    const health: SystemHealthStatus = {
      status: 'healthy',
      uptime: Math.floor(process.uptime()),
      timestamp: new Date(),
      services: {
        api: { status: 'healthy', uptime: Math.floor(process.uptime()) },
        database: { status: 'healthy', latencyMs: 2 },
        redis: { status: 'healthy', latencyMs: 1 },
      },
    };

    return { health };
  }
}
