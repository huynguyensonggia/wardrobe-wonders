import { MigrationInterface, QueryRunner, Table, TableIndex } from "typeorm";

export class CreateAuditLogsTable1770080356899 implements MigrationInterface {
  name = "CreateAuditLogsTable1770080356899";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: "audit_logs",
        columns: [
          {
            name: "id",
            type: "int",
            isPrimary: true,
            isGenerated: true,
            generationStrategy: "increment",
          },
          {
            name: "admin_id",
            type: "int",
          },
          {
            name: "admin_email",
            type: "varchar",
            length: "255",
          },
          {
            name: "action",
            type: "enum",
            enum: [
              "USER_UPDATE",
              "USER_DELETE",
              "PRODUCT_CREATE",
              "PRODUCT_UPDATE",
              "PRODUCT_DELETE",
              "PRODUCT_IMPORT",
              "CATEGORY_CREATE",
              "CATEGORY_UPDATE",
              "CATEGORY_DELETE",
              "RENTAL_STATUS_UPDATE",
              "RENTAL_SHIPPING_UPDATE",
              "RENTAL_SURCHARGE_ADD",
              "RENTAL_REFUND_DEPOSIT",
              "RENTAL_ACTUAL_RETURN",
              "RENTAL_DELETE",
            ],
          },
          {
            name: "resource_type",
            type: "varchar",
            length: "50",
          },
          {
            name: "resource_id",
            type: "int",
            isNullable: true,
          },
          {
            name: "old_value",
            type: "json",
            isNullable: true,
          },
          {
            name: "new_value",
            type: "json",
            isNullable: true,
          },
          {
            name: "ip_address",
            type: "varchar",
            length: "45",
            isNullable: true,
          },
          {
            name: "created_at",
            type: "datetime",
            default: "CURRENT_TIMESTAMP",
          },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      "audit_logs",
      new TableIndex({ name: "IDX_audit_logs_admin_id", columnNames: ["admin_id"] }),
    );
    await queryRunner.createIndex(
      "audit_logs",
      new TableIndex({ name: "IDX_audit_logs_action", columnNames: ["action"] }),
    );
    await queryRunner.createIndex(
      "audit_logs",
      new TableIndex({ name: "IDX_audit_logs_resource", columnNames: ["resource_type", "resource_id"] }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable("audit_logs");
  }
}
