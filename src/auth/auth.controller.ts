import { Controller, Post, Body, HttpCode, HttpStatus, UsePipes, ValidationPipe, UseGuards, Req, HttpException, HttpStatus as HttpStatusEnum } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { Public } from './decorators/public.decorator';
import { RateLimit } from './decorators/rate-limit.decorator';
import { RateLimitGuard } from './guards/rate-limit.guard';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly rateLimitGuard: RateLimitGuard,
  ) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @Public()
  @RateLimit()
  async login(@Body() loginDto: LoginDto, @Req() req: any) {
    try {
      const result = await this.authService.login(loginDto);
      // Registrar intento exitoso
      const clientIp = req.ip || req.connection?.remoteAddress || 'unknown';
      this.rateLimitGuard.recordSuccessfulAttempt(clientIp);
      return result;
    } catch (error) {
      // Registrar intento fallido
      const clientIp = req.ip || req.connection?.remoteAddress || 'unknown';
      this.rateLimitGuard.recordFailedAttempt(clientIp);
      throw error;
    }
  }
}