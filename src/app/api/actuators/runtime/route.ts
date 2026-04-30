import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { ok, unauthorized } from '@/lib/api';

export async function GET(request: Request) {
  try {
    requireAuth(request);

    // Use raw SQL to bypass generated-client validation (which rejects unknown
    // select fields like `mode` when the compiled schema is stale pre-migration).
    let buzzerMode: 'AUTO' | 'OFF' = 'OFF';
    let buzzerState: 'ON' | 'OFF' = 'OFF';

    try {
      const rows = await prisma.$queryRaw<Array<{ currentState: string; mode: string | null }>>`
        SELECT "currentState", "mode" FROM "Actuator" WHERE "role" = 'buzzer' LIMIT 1
      `;
      if (rows.length > 0) {
        buzzerState = rows[0].currentState === 'ON' ? 'ON' : 'OFF';
        buzzerMode = rows[0].mode === 'AUTO' ? 'AUTO' : 'OFF';
      }
    } catch {
      // mode column doesn't exist yet — read currentState only.
      const buzzer = await prisma.actuator.findFirst({
        where: { role: 'buzzer' },
        select: { currentState: true },
      });
      buzzerState = buzzer?.currentState === 'ON' ? 'ON' : 'OFF';
      buzzerMode = 'OFF';
    }

    return ok({ buzzerState, buzzerMode });
  } catch {
    return unauthorized('Not authenticated');
  }
}
