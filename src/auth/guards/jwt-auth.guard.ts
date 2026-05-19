import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    // Revisa si la ruta tiene el decorador @Public()
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    // Si no es pública, ejecuta la validación de la estrategia JWT
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any) {
    // Si hay un error de Passport o el usuario no fue encontrado/validado en la estrategia
    if (err || !user) {
      throw err || new UnauthorizedException('No tienes permiso para acceder a este recurso');
    }
    
    // Retorna el usuario para que esté disponible en req.user
    return user;
  }
}
