import { verifyToken } from '@/lib/utils';

export type JwtPayload = {
  userId: number;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
};

function getTokenFromCookie(request: Request): string | null {
  const cookieHeader = request.headers.get('cookie');
  if (!cookieHeader) return null;

  const cookies = cookieHeader.split(';').map((item) => item.trim());
  const tokenCookie = cookies.find((item) => item.startsWith('token='));
  return tokenCookie ? tokenCookie.slice('token='.length) : null;
}

function getBearerToken(request: Request): string | null {
  const authHeader = request.headers.get('authorization');
  if (authHeader) {
    const [scheme, token] = authHeader.split(' ');
    if (scheme === 'Bearer' && token) return token;
  }

  return getTokenFromCookie(request);
}

export function requireAuth(request: Request): JwtPayload {
  const token = getBearerToken(request);
  if (!token) {
    throw new Error('Missing or invalid bearer token');
  }

  const payload = verifyToken(token);
  if (!payload || typeof payload !== 'object') {
    throw new Error('Invalid or expired token');
  }

  const jwtPayload = payload as JwtPayload;
  if (!jwtPayload.userId || !jwtPayload.email || !jwtPayload.role) {
    throw new Error('Invalid token payload');
  }

  return jwtPayload;
}

export function requireRole(userRole: string, allowedRoles: string[]) {
  if (!allowedRoles.includes(userRole)) {
    throw new Error('Insufficient permissions');
  }
}
