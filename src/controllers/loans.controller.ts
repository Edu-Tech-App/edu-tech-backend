import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Put, Delete } from '@nestjs/common';
import { LoansService } from '../services/loans.service';
import { CreateLoanDto } from '../dto/loans/create-loan.dto';
import { UpdateLoanDto } from '../dto/loans/update-loan.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../entities/user.entity';
import { LoanStatus } from '../entities/loan.entity';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('loans')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('loans')
export class LoansController {
  constructor(private readonly loansService: LoansService) {}

  private assertOwnLoanResource(userIdParam: number, req: any) {
    const userRol = req.user.rol;
    const userId = req.user.userId || req.user.id;

    if (
      [UserRole.ESTUDIANTE, UserRole.DOCENTE].includes(userRol) &&
      userIdParam !== userId
    ) {
      throw new ForbiddenException(
        'Solo puedes consultar prestamos y multas de tu propio usuario',
      );
    }
  }

  @Get('user/:userId')
  @Roles(
    UserRole.ESTUDIANTE,
    UserRole.DOCENTE,
    UserRole.BIBLIOTECARIO,
    UserRole.ADMINISTRATIVO,
  )
  findByUser(@Param('userId') userId: string, @Req() req: any) {
    this.assertOwnLoanResource(+userId, req);
    return this.loansService.findByUser(+userId);
  }

  @Get('fines/pending/:userId')
  @Roles(UserRole.ESTUDIANTE, UserRole.DOCENTE, UserRole.BIBLIOTECARIO)
  findPendingFines(@Param('userId') userId: number, @Req() req: any) {
    this.assertOwnLoanResource(+userId, req);
    return this.loansService.findPendingFinesByUser(userId);
  }

  // ✅ Nuevo endpoint para todas las multas
  @Get('fines/all')
  @Roles(UserRole.BIBLIOTECARIO, UserRole.ADMINISTRATIVO)
  findAllFines() {
    return this.loansService.findAllFines();
  }

  @Get('fines/payments/all')
  @Roles(UserRole.BIBLIOTECARIO, UserRole.ADMINISTRATIVO)
  findAllPayments() {
    return this.loansService.findAllPayments();
  }

  @Post()
  @Roles(UserRole.ESTUDIANTE, UserRole.DOCENTE, UserRole.BIBLIOTECARIO)
  @ApiOperation({ summary: 'Solicitar o registrar un prestamo de libro' })
  @ApiBody({
    type: CreateLoanDto,
    examples: {
      estudiante: {
        summary: 'Solicitud de estudiante',
        value: {
          libroId: 1,
          estudianteId: 1,
          fechaLimiteDevolucion: '2026-06-15',
        },
      },
      docente: {
        summary: 'Solicitud de docente',
        value: {
          libroId: 1,
          estudianteId: 2,
          fechaLimiteDevolucion: '2026-06-15',
        },
      },
    },
  })
  create(@Body() createLoanDto: CreateLoanDto, @Req() req: any) {
    const userRol = req.user.rol;
    const userId = req.user.userId || req.user.id;

    if (
      [UserRole.ESTUDIANTE, UserRole.DOCENTE].includes(userRol) &&
      createLoanDto.estudianteId !== userId
    ) {
      throw new ForbiddenException(
        'Solo puedes solicitar prestamos para tu propio usuario',
      );
    }

    return this.loansService.create(createLoanDto);
  }

  @Get()
  @Roles(UserRole.BIBLIOTECARIO, UserRole.ADMINISTRATIVO)
  findAll() {
    return this.loansService.findAll();
  }

  @Get('student/:userId')
  @Roles(
    UserRole.ESTUDIANTE,
    UserRole.DOCENTE,
    UserRole.ADMINISTRATIVO,
    UserRole.BIBLIOTECARIO,
  )
  @ApiQuery({ name: 'status', required: false, enum: LoanStatus })
  @ApiQuery({
    name: 'startDate',
    required: false,
    type: String,
    description: 'YYYY-MM-DD',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    type: String,
    description: 'YYYY-MM-DD',
  })
  findByStudent(
    @Param('userId') userId: string,
    @Req() req: any,
    @Query('status') status?: LoanStatus,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    this.assertOwnLoanResource(+userId, req);
    return this.loansService.findByStudent(+userId, status, startDate, endDate);
  }

  @Patch(':id/return')
  @Roles(UserRole.BIBLIOTECARIO)
  returnLoan(@Param('id') id: string) {
    return this.loansService.returnLoan(+id);
  }

  @Put(':id')
  @Roles(UserRole.BIBLIOTECARIO)
  update(@Param('id') id: string, @Body() updateLoanDto: UpdateLoanDto) {
    return this.loansService.update(+id, updateLoanDto);
  }

  @Delete(':id')
  @Roles(UserRole.BIBLIOTECARIO)
  remove(@Param('id') id: string) {
    return this.loansService.remove(+id);
  }

  @Post('fines/:id/pay')
  @Roles(
    UserRole.ESTUDIANTE,
    UserRole.DOCENTE,
    UserRole.BIBLIOTECARIO,
    UserRole.ADMINISTRATIVO,
  )
  payFine(@Param('id') id: string) {
    return this.loansService.payFine(+id);
  }
}
// ISOR)
//   payFine(@Param('id') id: string) {
//     return this.loansService.payFine(+id);
//   }
// }
// Fine(+id);
//   }
// }
