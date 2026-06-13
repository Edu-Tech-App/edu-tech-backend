import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateParticipantInvitationCodes1750000000001
  implements MigrationInterface
{
  name = 'CreateParticipantInvitationCodes1750000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const tableExists = await queryRunner.hasTable(
      'codigos_invitacion_participantes',
    );

    if (!tableExists) {
      await queryRunner.createTable(
        new Table({
          name: 'codigos_invitacion_participantes',
          columns: [
            {
              name: 'id',
              type: 'int',
              isPrimary: true,
              isGenerated: true,
              generationStrategy: 'increment',
            },
            {
              name: 'codigo',
              type: 'varchar',
              length: '6',
              isUnique: true,
            },
            {
              name: 'generado_por',
              type: 'varchar',
              length: '100',
              isNullable: true,
            },
            {
              name: 'registrado_nombre',
              type: 'varchar',
              length: '100',
              isNullable: true,
            },
            {
              name: 'usado',
              type: 'boolean',
              default: false,
            },
            {
              name: 'usado_en',
              type: 'datetime',
              isNullable: true,
            },
            {
              name: 'creado_en',
              type: 'datetime',
              default: 'CURRENT_TIMESTAMP',
            },
          ],
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const tableExists = await queryRunner.hasTable(
      'codigos_invitacion_participantes',
    );

    if (tableExists) {
      await queryRunner.dropTable('codigos_invitacion_participantes');
    }
  }
}
