import request from 'supertest';
import type { FastifyInstance } from 'fastify';

interface CreateVolumeOptions {
  token: string;
  name?: string;
  notes?: string;
  destinationRef?: string;
}

/**
 * Creates a volume via API for E2E tests
 */
export async function createVolumeE2E(
  app: FastifyInstance,
  options: CreateVolumeOptions,
) {
  const response = await request(app.server)
    .post('/v1/volumes')
    .set('Authorization', `Bearer ${options.token}`)
    .send({
      name: options.name ?? `Volume Test ${Date.now()}`,
      notes: options.notes,
      destinationRef: options.destinationRef,
    });

  if (response.status !== 201) {
    throw new Error(`Failed to create volume: ${response.body.message}`);
  }

  return {
    volume: response.body.volume,
    volumeId: response.body.volume.id,
  };
}
