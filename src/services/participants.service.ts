import {
  ConflictException,
  Injectable,
  NotFoundException,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthorizedParticipant } from '../entities/authorized-participant.entity';
import { AccessParticipantDto } from '../dto/participants/access-participant.dto';

@Injectable()
export class ParticipantsService implements OnModuleInit {
  // Lista fija de personas autorizadas a entrar al apartado nuevo.
  private readonly nombresAutorizados = [
    'Tatiana Diaz',
    'Ivan Aragon',
    'Jhoan Malua',
    'Daniel Yanguatin',
    'Administrador',
  ];

  constructor(
    @InjectRepository(AuthorizedParticipant)
    private readonly authorizedRepository: Repository<AuthorizedParticipant>,
  ) {}

  // Al arrancar la app, registra los nombres autorizados SIN código (solo si faltan).
  // El código lo genera después el administrador, uno por uno.
  async onModuleInit(): Promise<void> {
    for (const nombre of this.nombresAutorizados) {
      const yaExiste = await this.authorizedRepository.countBy({ nombre });
      if (yaExiste === 0) {
        await this.authorizedRepository.save(
          this.authorizedRepository.create({ nombre, codigo: null }),
        );
      }
    }
  }

  // El administrador agrega una nueva persona autorizada (sin código todavía).
  async addAuthorized(nombre: string): Promise<AuthorizedParticipant> {
    const nombreLimpio = nombre.trim();
    const yaExiste = await this.authorizedRepository.countBy({
      nombre: nombreLimpio,
    });

    if (yaExiste > 0) {
      throw new ConflictException(
        `"${nombreLimpio}" ya está en la lista de autorizados.`,
      );
    }

    return this.authorizedRepository.save(
      this.authorizedRepository.create({ nombre: nombreLimpio, codigo: null }),
    );
  }

  // El administrador genera (o regenera) un código aleatorio para un autorizado.
  async generateCodeForUser(
    nombre: string,
  ): Promise<{ nombre: string; codigo: string }> {
    const persona = await this.authorizedRepository.findOne({
      where: { nombre },
    });

    if (!persona) {
      throw new NotFoundException(
        `"${nombre}" no está en la lista de usuarios autorizados.`,
      );
    }

    persona.codigo = await this.generateUniqueCode();
    await this.authorizedRepository.save(persona);

    return { nombre: persona.nombre, codigo: persona.codigo };
  }

  // Valida el acceso: el nombre y el código deben coincidir con un autorizado.
  // En el primer acceso correcto se marca como "confirmado": queda registrado
  // y ya no necesita volver a digitar el código.
  async validateAccess(dto: AccessParticipantDto): Promise<{
    autorizado: true;
    nombre: string;
    confirmado: true;
    yaEstabaRegistrado: boolean;
  }> {
    const persona = await this.authorizedRepository.findOne({
      where: { codigo: dto.codigo },
    });

    const nombreCoincide =
      persona &&
      persona.nombre.trim().toLowerCase() === dto.nombre.trim().toLowerCase();

    if (!persona || !nombreCoincide) {
      throw new UnauthorizedException(
        'Nombre o código incorrecto: no estás autorizado para entrar.',
      );
    }

    const yaEstabaRegistrado = persona.confirmado;
    if (!persona.confirmado) {
      persona.confirmado = true;
      persona.confirmadoEn = new Date();
      await this.authorizedRepository.save(persona);
    }

    return {
      autorizado: true,
      nombre: persona.nombre,
      confirmado: true,
      yaEstabaRegistrado,
    };
  }

  // Consulta si una persona ya quedó registrada (confirmada). El frontend lo usa
  // para no volver a pedir el código a quien ya entró antes.
  async getStatus(
    nombre: string,
  ): Promise<{ nombre: string; autorizado: boolean; confirmado: boolean }> {
    const persona = await this.authorizedRepository.findOne({
      where: { nombre: nombre.trim() },
    });

    if (!persona) {
      return { nombre: nombre.trim(), autorizado: false, confirmado: false };
    }

    return {
      nombre: persona.nombre,
      autorizado: true,
      confirmado: persona.confirmado,
    };
  }

  // Lista de autorizados con su código (uso exclusivo del administrador).
  findAll(): Promise<AuthorizedParticipant[]> {
    return this.authorizedRepository.find({ order: { nombre: 'ASC' } });
  }

  // Genera un código numérico único de 6 dígitos (100000 - 999999).
  private async generateUniqueCode(): Promise<string> {
    let codigo: string;
    let yaExiste: number;

    do {
      codigo = Math.floor(100000 + Math.random() * 900000).toString();
      yaExiste = await this.authorizedRepository.countBy({ codigo });
    } while (yaExiste > 0);

    return codigo;
  }
}
