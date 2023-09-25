/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.alterTable("notificationType", (table) => {
    table.specificType("tags", "text[]").defaultTo("{}");
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.alterTable("notificationType", (table) => {
    table.dropColumn("tags");
  });
};
