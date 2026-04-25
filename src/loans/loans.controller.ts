import { Controller, Post, Body, Get, Param, Patch } from '@nestjs/common';
import { LoansService } from './loans.service';
import { CreateLoanDto } from './dto/create-loan.dto';

@Controller('loans')
export class LoansController {
  constructor(private readonly loansService: LoansService) {}

  @Get('fines/pending/:userId')
  findPendingFines(@Param('userId') userId: number) {
    return this.loansService.findPendingFinesByUser(userId);
  }

  @Post()
  create(@Body() createLoanDto: CreateLoanDto) {
    return this.loansService.create(createLoanDto);
  }

  @Get()
  findAll() {
    return this.loansService.findAll();
  }

  @Patch(':id/return')
  returnLoan(@Param('id') id: string) {
    return this.loansService.returnLoan(+id);
  }

  @Post('fines/:id/pay')
  payFine(@Param('id') id: string) {
    return this.loansService.payFine(+id);
  }
}
