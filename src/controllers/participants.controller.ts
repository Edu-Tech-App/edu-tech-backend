import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ParticipantsService } from '../services/participants.service';
import { AccessParticipantDto } from '../dto/participants/access-participant.dto';
import { GenerateCodeDto } from '../dto/participants/generate-code.dto';
import { CreateAuthorizedDto } from '../dto/participants/create-authorized.dto';
import { RegisterWithInvitationDto } from '../dto/participants/register-with-invitation.dto';
import { ValidateInvitationCodeDto } from '../dto/participants/validate-invitation-code.dto';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../entities/user.entity';

@ApiTags('participants')
@Controller('participants')
export class ParticipantsController {
  constructor(private readonly participantsService: ParticipantsService) {}

  // Ruta pública: valida si la persona está autorizada a entrar al apartado.
  // Si el nombre/código no coinciden, responde 401 (no autorizado).
  @Post('acceso')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Validar acceso de una persona autorizada con su nombre y código',
  })
  validarAcceso(@Body() accessParticipantDto: AccessParticipantDto) {
    return this.participantsService.validateAccess(accessParticipantDto);
  }

  @Post('registro-invitacion')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Registrar participante con un código de invitación único',
  })
  registrarConInvitacion(
    @Body() registerWithInvitationDto: RegisterWithInvitationDto,
  ) {
    return this.participantsService.registerWithInvitation(
      registerWithInvitationDto,
    );
  }

  @Post('validar-codigo-invitacion')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Validar si un código de invitación sigue disponible',
  })
  validarCodigoInvitacion(
    @Body() validateInvitationCodeDto: ValidateInvitationCodeDto,
  ) {
    return this.participantsService.validateInvitationCode(
      validateInvitationCodeDto.codigo,
    );
  }

  // Ruta pública: el frontend consulta si una persona ya quedó registrada
  // (confirmada) para no volver a pedirle el código.
  @Get('estado')
  @Public()
  @ApiQuery({ name: 'nombre', example: 'Tatiana Diaz' })
  @ApiOperation({
    summary: 'Consultar si una persona ya está registrada (confirmada)',
  })
  consultarEstado(@Query('nombre') nombre: string) {
    return this.participantsService.getStatus(nombre ?? '');
  }

  // Ruta protegida: el administrador agrega una nueva persona autorizada.
  @Post()
  @Roles(UserRole.SUPERVISOR, UserRole.ADMINISTRATIVO)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'El administrador agrega una nueva persona autorizada',
  })
  agregarAutorizado(@Body() createAuthorizedDto: CreateAuthorizedDto) {
    return this.participantsService.addAuthorized(createAuthorizedDto.nombre);
  }

  // Ruta protegida: el administrador genera un código aleatorio para un autorizado.
  @Post('generar-codigo')
  @Roles(UserRole.SUPERVISOR, UserRole.ADMINISTRATIVO)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'El administrador genera un código aleatorio para un usuario autorizado',
  })
  generarCodigo(@Body() generateCodeDto: GenerateCodeDto) {
    return this.participantsService.generateCodeForUser(generateCodeDto.nombre);
  }

  @Post('generar-codigo-invitacion')
  @Roles(UserRole.SUPERVISOR, UserRole.ADMINISTRATIVO)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'El administrador genera un código de invitación libre para compartir',
  })
  generarCodigoInvitacion() {
    return this.participantsService.generateInvitationCode('Administrador');
  }

  // Ruta protegida: solo el administrador ve la lista de autorizados y sus códigos.
  @Get()
  @Roles(UserRole.SUPERVISOR, UserRole.ADMINISTRATIVO)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Listar personas autorizadas con su código (solo administrador)',
  })
  findAll() {
    return this.participantsService.findAll();
  }

  @Get('codigos-invitacion')
  @Roles(UserRole.SUPERVISOR, UserRole.ADMINISTRATIVO)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Listar códigos de invitación generados para participantes',
  })
  findAllInvitationCodes() {
    return this.participantsService.findAllInvitationCodes();
  }
}
