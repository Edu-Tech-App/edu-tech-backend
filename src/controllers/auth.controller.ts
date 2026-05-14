import { Controller, Post, Body, HttpCode, HttpStatus, UsePipes, ValidationPipe, Req } from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { LoginDto } from '../dto/auth/login.dto';
import { Public } from '../auth/decorators/public.decorator';
import { RateLimit } from '../auth/decorators/rate-limit.decorator';
import { RateLimitGuard } from '../auth/guards/rate-limit.guard';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly rateLimitGuard: RateLimitGuard,
  ) { }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @Public()
  @RateLimit()
  async login(@Body() loginDto: LoginDto, @Req() req: any) {
    try {
      const result = await this.authService.login(loginDto);
      const clientIp = req.ip || req.connection?.remoteAddress || 'unknown';
      this.rateLimitGuard.recordSuccessfulAttempt(clientIp);
      return result;
    } catch (error) {
      const clientIp = req.ip || req.connection?.remoteAddress || 'unknown';
      this.rateLimitGuard.recordFailedAttempt(clientIp);
      throw error;
    }
  }
}
