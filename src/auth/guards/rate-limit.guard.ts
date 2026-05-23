import { CanActivate, ExecutionContext, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

interface RateLimitEntry {
  count: number;
  firstAttempt: number;
  blockedUntil: number | null;
}

@Injectable()
export class RateLimitGuard implements CanActivate {
  private static readonly rateLimitMap = new Map<string, RateLimitEntry>();
  private readonly isDevelopment = process.env.NODE_ENV !== 'production';
  private readonly MAX_ATTEMPTS = this.isDevelopment ? 10 : 5;
  private readonly ATTEMPT_WINDOW_MS = this.isDevelopment ? 60 * 1000 : 15 * 60 * 1000;
  private readonly BLOCK_DURATION_MS = this.isDevelopment ? 60 * 1000 : 15 * 60 * 1000;

  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isRateLimited = this.reflector.getAllAndOverride<boolean>('rateLimit', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!isRateLimited) {
      return true;
    }

    if (this.isDevelopment) {
      this.cleanupExpiredEntries();
    }

    const request = context.switchToHttp().getRequest();
    const clientKey = this.getClientKey(request);
    const entry = RateLimitGuard.rateLimitMap.get(clientKey);

    if (!entry) {
      return true;
    }

    const now = Date.now();

    if (entry.blockedUntil && now < entry.blockedUntil) {
      const remainingMinutes = Math.max(1, Math.ceil((entry.blockedUntil - now) / 1000 / 60));
      throw new HttpException(
        `Demasiados intentos fallidos. Intenta de nuevo en ${remainingMinutes} minuto(s)`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    if (entry.blockedUntil && now >= entry.blockedUntil) {
      RateLimitGuard.rateLimitMap.delete(clientKey);
      return true;
    }

    if (now - entry.firstAttempt >= this.ATTEMPT_WINDOW_MS) {
      RateLimitGuard.rateLimitMap.delete(clientKey);
    }

    return true;
  }

  recordFailedAttempt(clientKey: string): void {
    const now = Date.now();
    const current = RateLimitGuard.rateLimitMap.get(clientKey);

    if (!current || now - current.firstAttempt >= this.ATTEMPT_WINDOW_MS || (current.blockedUntil && now >= current.blockedUntil)) {
      const nextEntry: RateLimitEntry = {
        count: 1,
        firstAttempt: now,
        blockedUntil: null,
      };

      if (nextEntry.count >= this.MAX_ATTEMPTS) {
        nextEntry.blockedUntil = now + this.BLOCK_DURATION_MS;
      }

      RateLimitGuard.rateLimitMap.set(clientKey, nextEntry);
      return;
    }

    current.count += 1;

    if (current.count >= this.MAX_ATTEMPTS) {
      current.blockedUntil = now + this.BLOCK_DURATION_MS;
    }

    RateLimitGuard.rateLimitMap.set(clientKey, current);
  }

  recordSuccessfulAttempt(clientKey: string): void {
    RateLimitGuard.rateLimitMap.delete(clientKey);
  }

  resetClient(clientKey: string): void {
    RateLimitGuard.rateLimitMap.delete(clientKey);
  }

  resetAll(): void {
    RateLimitGuard.rateLimitMap.clear();
  }

  getClientKeyFromRequest(request: {
    headers?: Record<string, string | string[] | undefined>;
    ip?: string;
    connection?: { remoteAddress?: string };
    socket?: { remoteAddress?: string };
  }): string {
    return this.getClientKey(request);
  }

  private getClientKey(request: {
    headers?: Record<string, string | string[] | undefined>;
    ip?: string;
    connection?: { remoteAddress?: string };
    socket?: { remoteAddress?: string };
  }): string {
    const forwardedFor = request.headers?.['x-forwarded-for'];
    const forwardedIp = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor?.split(',')[0]?.trim();

    return (
      forwardedIp ||
      request.ip ||
      request.socket?.remoteAddress ||
      request.connection?.remoteAddress ||
      'unknown'
    );
  }

  private cleanupExpiredEntries(): void {
    const now = Date.now();

    for (const [key, entry] of RateLimitGuard.rateLimitMap.entries()) {
      const blockExpired = entry.blockedUntil && now >= entry.blockedUntil;
      const windowExpired = now - entry.firstAttempt >= this.ATTEMPT_WINDOW_MS;

      if (blockExpired || windowExpired) {
        RateLimitGuard.rateLimitMap.delete(key);
      }
    }
  }
}
