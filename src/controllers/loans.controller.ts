import { Controller, Post, Body, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { LoansService } from '../services/loans.service';
import { CreateLoanDto } from '../dto/loans/create-loan.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../entities/user.entity';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('loans')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('loans')
export class LoansController {
  constructor(private readonly loansService: LoansService) {}

  @Get('fines/pending/:userId')
  @Roles(UserRole.ESTUDIANTE, UserRole.BIBLIOTECARIO)
  findPendingFines(@Param('userId') userId: number) {
    return this.loansService.findPendingFinesByUser(userId);
  }

  @Post()
  @Roles(UserRole.BIBLIOTECARIO)
  create(@Body() createLoanDto: CreateLoanDto) {
    return this.loansService.create(createLoanDto);
  }

  @Get()
  @Roles(UserRole.BIBLIOTECARIO, UserRole.ADMINISTRATIVO)
  findAll() {
    return this.loansService.findAll();
  }

  @Patch(':id/return')
  @Roles(UserRole.BIBLIOTECARIO)
  returnLoan(@Param('id') id: string) {
    return this.loansService.returnLoan(+id);
  }

  @Post('fines/:id/pay')
  @Roles(UserRole.ESTUDIANTE)
  payFine(@Param('id') id: string) {
    return this.loansService.payFine(+id);
  }
}
