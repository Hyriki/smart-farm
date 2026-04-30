import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { ok, unauthorized } from '@/lib/api';

export async function GET(request: Request) {
  try {
    requireAuth(request);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pc = prisma as any;
    const notifications = pc.notification
      ? await pc.notification.findMany({
          where: { isResolved: false },
          orderBy: { updatedAt: 'desc' },
        }).catch(() => [])
      : [];

    return ok({ notifications });
  } catch {
    return unauthorized('Not authenticated');
  }
}
