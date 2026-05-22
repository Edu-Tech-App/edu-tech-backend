import { Controller, Post, Body, HttpCode, HttpStatus, UsePipes, ValidationPipe, UseGuards, Req } from '@nestjs/common';
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
  @Public()
  @RateLimit()
  @UseGuards(RateLimitGuard)
  async login(@Body() loginDto: LoginDto, @Req() req: any) {
    const clientIp = req.ip || req.connection?.remoteAddress || 'unknown';
    try {
      const result = await this.authService.login(loginDto);
      this.rateLimitGuard.recordSuccessfulAttempt(clientIp);
      return result;
    } catch (error) {
      this.rateLimitGuard.recordFailedAttempt(clientIp);
      throw error;
    }
  }

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @Public()
  async register(@Body() registerDto: any) {
    return await this.authService.register(registerDto);
  }
}