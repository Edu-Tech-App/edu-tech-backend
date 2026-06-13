import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedParticipantsAdmin1750000000000
  implements MigrationInterface
{
  name = 'SeedParticipantsAdmin1750000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const existingUser = (await queryRunner.query(
      `
        SELECT id
        FROM usuarios
        WHERE correo_institucional = ?
        LIMIT 1
      `,
      ['admin@universidad.edu.co'],
    )) as Array<{ id: number }>;

    if (existingUser.length === 0) {
      await queryRunner.query(
        `
          INSERT INTO usuarios (
            nombre_completo,
            documento_identidad,
            correo_institucional,
            password_hash,
            rol,
            estado,
            actualizado_por_id,
            creado_en,
            actualizado_en
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        `,
        [
          'Administrador',
          'PARTICIPANTES-ADM',
          'admin@universidad.edu.co',
          '$2b$10$nxw7/aUNVDtE2ZTAqgE/EO50Mu3EqsZRdeVnkKcpYzQ2FdYqcsL5u',
          'supervisor',
          'activo',
          null,
        ],
      );
    }

    const existingAuthorized = (await queryRunner.query(
      `
        SELECT id
        FROM participantes_autorizados
        WHERE nombre = ?
        LIMIT 1
      `,
      ['Administrador'],
    )) as Array<{ id: number }>;

    if (existingAuthorized.length === 0) {
      await queryRunner.query(
        `
          INSERT INTO participantes_autorizados (
            nombre,
            codigo,
            confirmado,
            confirmado_en,
            creado_en
          )
          VALUES (?, ?, ?, ?, NOW())
        `,
        ['Administrador', null, false, null],
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `
        DELETE FROM usuarios
        WHERE correo_institucional = ?
          AND documento_identidad = ?
      `,
      ['admin@universidad.edu.co', 'PARTICIPANTES-ADM'],
    );

    await queryRunner.query(
      `
        DELETE FROM participantes_autorizados
        WHERE nombre = ?
          AND codigo IS NULL
      `,
      ['Administrador'],
    );
  }
}
