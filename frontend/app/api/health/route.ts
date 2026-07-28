/**
 * Liveness probe. The Dockerfile's HEALTHCHECK has always pointed here; the
 * route simply never existed, so every container reported unhealthy.
 */
export const dynamic = 'force-dynamic';

export function GET() {
  return Response.json({ status: 'ok' });
}
