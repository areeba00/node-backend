/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function (knex) {
  // Deletes ALL existing entries
  await knex("event").del();
  const eventData = [
    {
      name: "course assigned",
      description: "course has been assigned",
      application_id: "1",
    },
  ];
  return knex("event").insert(eventData);
};
