import { requireAuth } from '@/lib/auth';
import {
  getLatestSensorSnapshot,
  subscribeToSensorSnapshot,
  type LatestSensorSnapshot,
} from '@/lib/mqtt/sensorDataHandler';

export const dynamic = 'force-dynamic';
// Disable Next's response compression for this stream — buffering breaks SSE.
export const fetchCache = 'force-no-store';

export async function GET(request: Request) {
  try {
    requireAuth(request);
  } catch {
    return new Response('unauthorized', { status: 401 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      function send(event: string, data: unknown) {
        const payload =
          `event: ${event}\n` +
          `data: ${JSON.stringify(data)}\n\n`;
        controller.enqueue(encoder.encode(payload));
      }

      // Initial snapshot — page reload picks up last known data immediately,
      // even before the next MQTT message arrives.
      send('snapshot', getLatestSensorSnapshot());

      const onSnap = (snap: LatestSensorSnapshot) => send('snapshot', snap);
      const unsubscribe = subscribeToSensorSnapshot(onSnap);

      // Heartbeat keeps proxies / Turbopack from closing the stream as idle.
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: ping ${Date.now()}\n\n`));
        } catch {
          // controller already closed
        }
      }, 15_000);

      const close = () => {
        clearInterval(heartbeat);
        unsubscribe();
        try {
          controller.close();
        } catch {
          // already closed
        }
      };

      // Closes when the client disconnects (browser navigation, tab close).
      request.signal.addEventListener('abort', close);
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
