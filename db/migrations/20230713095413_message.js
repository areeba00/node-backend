/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable("message", (table) => {
    table.increments("id");
    table.string("text").notNullable();
    table.integer("notificationType_id").unsigned();
    table
      .foreign("notificationType_id")
      .references("id")
      .inTable("notificationType");

    table.timestamps(true, true);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable("message");
};
