import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

interface RateLimitEntry {
  count: number;
  firstAttempt: number;
  blockedUntil: number | null;
}

@Injectable()
export class RateLimitGuard implements CanActivate {
  private rateLimitMap = new Map<string, RateLimitEntry>();
  private readonly MAX_ATTEMPTS = 5;
  private readonly BLOCK_DURATION_MS = 30 * 60 * 1000; // 30 minutos

  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isRateLimited = this.reflector.getAllAndOverride<boolean>('rateLimit', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!isRateLimited) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const clientIp = request.ip || request.connection?.remoteAddress || 'unknown';

    const entry = this.rateLimitMap.get(clientIp);

    // Si está bloqueado
    if (entry?.blockedUntil && Date.now() < entry.blockedUntil) {
      const remainingTime = Math.ceil((entry.blockedUntil - Date.now()) / 1000 / 60);
      throw new HttpException(
        `Demasiados intentos fallidos. Intenta de nuevo en ${remainingTime} minutos`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // Limpiar bloqueo expirado
    if (entry?.blockedUntil && Date.now() >= entry.blockedUntil) {
      this.rateLimitMap.delete(clientIp);
    }

    return true;
  }

  // Método para registrar intento fallido
  recordFailedAttempt(clientIp: string): void {
    const entry = this.rateLimitMap.get(clientIp) || {
      count: 0,
      firstAttempt: Date.now(),
      blockedUntil: null,
    };

    entry.count++;

    if (entry.count >= this.MAX_ATTEMPTS) {
      entry.blockedUntil = Date.now() + this.BLOCK_DURATION_MS;
    }

    this.rateLimitMap.set(clientIp, entry);
  }

  // Método para registrar intento exitoso
  recordSuccessfulAttempt(clientIp: string): void {
    this.rateLimitMap.delete(clientIp);
  }

  // Limpiar entradas antiguas cada 5 minutos
  cleanup(): void {
    const now = Date.now();
    for (const [ip, entry] of this.rateLimitMap.entries()) {
      if (entry.blockedUntil && now > entry.blockedUntil) {
        this.rateLimitMap.delete(ip);
      } else if (!entry.blockedUntil && now - entry.firstAttempt > this.BLOCK_DURATION_MS) {
        this.rateLimitMap.delete(ip);
      }
    }
  }
}