import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

interface RateLimitEntry {
  count: number;
  firstAttempt: number;
  blockedUntil: number | null;
}

@Injectable()
export class RateLimitGuard implements CanActivate {
  private static readonly rateLimitMap = new Map<string, RateLimitEntry>();
  private readonly MAX_ATTEMPTS = 5;
  private readonly BLOCK_DURATION_MS = 30 * 60 * 1000; // 30 minutos

  constructor(private reflector: Reflector) {
    console.log('RateLimitGuard: instanciado');
  }

  canActivate(context: ExecutionContext): boolean {
    console.log('RateLimitGuard: canActivate iniciado');
    const isRateLimited = this.reflector.getAllAndOverride<boolean>('rateLimit', [
      context.getHandler(),
      context.getClass(),
    ]);

    console.log('RateLimitGuard: isRateLimited =', isRateLimited);

    if (!isRateLimited) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const clientIp = request.ip || request.connection?.remoteAddress || 'unknown';
    console.log('RateLimitGuard: clientIp =', clientIp);

    const entry = RateLimitGuard.rateLimitMap.get(clientIp);
    console.log('RateLimitGuard: entry =', entry);

    // Si está bloqueado
    if (entry?.blockedUntil && Date.now() < entry.blockedUntil) {
      const remainingTime = Math.ceil((entry.blockedUntil - Date.now()) / 1000 / 60);
      console.log(`RateLimitGuard: IP bloqueada. Intentos fallidos: ${entry.count}. Bloqueado hasta: ${entry.blockedUntil}`);
      throw new HttpException(
        `Demasiados intentos fallidos. Intenta de nuevo en ${remainingTime} minutos`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // Limpiar bloqueo expirado
    if (entry?.blockedUntil && Date.now() >= entry.blockedUntil) {
      console.log('RateLimitGuard: bloqueo expirado, limpiando entrada de IP');
      RateLimitGuard.rateLimitMap.delete(clientIp);
    }

    return true;
  }

  // Método para registrar intento fallido
  recordFailedAttempt(clientIp: string): void {
    console.log('RateLimitGuard: recordFailedAttempt para IP =', clientIp);
    const entry = RateLimitGuard.rateLimitMap.get(clientIp) || {
      count: 0,
      firstAttempt: Date.now(),
      blockedUntil: null,
    };

    entry.count++;
    console.log(`RateLimitGuard: Incrementando intentos de IP ${clientIp} a ${entry.count}`);

    if (entry.count >= this.MAX_ATTEMPTS) {
      entry.blockedUntil = Date.now() + this.BLOCK_DURATION_MS;
      console.log(`RateLimitGuard: IP ${clientIp} bloqueada por 30 minutos (hasta ${entry.blockedUntil})`);
    }

    RateLimitGuard.rateLimitMap.set(clientIp, entry);
  }

  // Método para registrar intento exitoso
  recordSuccessfulAttempt(clientIp: string): void {
    RateLimitGuard.rateLimitMap.delete(clientIp);
  }

  // Limpiar entradas antiguas cada 5 minutos
  cleanup(): void {
    const now = Date.now();
    for (const [ip, entry] of RateLimitGuard.rateLimitMap.entries()) {
      if (entry.blockedUntil && now > entry.blockedUntil) {
        RateLimitGuard.rateLimitMap.delete(ip);
      } else if (!entry.blockedUntil && now - entry.firstAttempt > this.BLOCK_DURATION_MS) {
        RateLimitGuard.rateLimitMap.delete(ip);
      }
    }
  }
}