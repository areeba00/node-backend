/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable("event", (table) => {
    table.increments("id");
    table.string("name").notNullable();
    table.string("description").notNullable();
    table.integer("application_id").unsigned();
    table.foreign("application_id").references("id").inTable("application");

    table.timestamps(true, true);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable("event");
};
