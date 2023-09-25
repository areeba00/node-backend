/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable("notificationType", (table) => {
    table.increments("id");
    table.string("name").notNullable();
    table.string("description").notNullable();
    table.string("template_subject").notNullable();
    table.string("template_body").notNullable();
    table.integer("event_id").unsigned();
    table.foreign("event_id").references("id").inTable("event");

    table.timestamps(true, true);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable("notificationType");
};
