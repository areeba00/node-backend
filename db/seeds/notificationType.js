/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function (knex) {
  // Deletes ALL existing entries
  await knex("notificationType").del();
  const notificationTypeData = [
    {
      name: "trainee notification",
      description: "trainee notification has been assigned",
      template_subject: "Course name",
      template_body: "dear {username}",
      event_id: 1,
    },
  ];
  return knex("notificationType").insert(notificationTypeData);
};
