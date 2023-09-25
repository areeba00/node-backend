/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function (knex) {
  // Deletes ALL existing entries
  await knex("application").del();
  const applicationData = [
    {
      name: "ETS",
      description: "a platform to asign courses",
    },
  ];
  return knex("application").insert(applicationData);
};
