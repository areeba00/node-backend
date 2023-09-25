/* eslint-disable camelcase */
const { StatusCodes } = require("http-status-codes");
const debug = require("debug");
const Joi = require("joi");
const knex = require("../knex");

exports.validateNotification = function (notification) {
  const schema = Joi.object({
    name: Joi.string().min(3).max(50).required(),
    description: Joi.string().min(5).max(300).required(),
    template_subject: Joi.string().min(5).required(),
    template_body: Joi.string().min(5).required(),
    event_id: Joi.number().required(),
  });
  return schema.validate(notification);
};

const validateQuery = Joi.object({
  name: Joi.string().min(3).optional(),
  page: Joi.number().optional(),
  limit: Joi.number().optional(),
  event_id: Joi.number().optional(),
  isActive: Joi.boolean().optional(),
  sortBy: Joi.string().valid("name", "created_at", "updated_at").optional(),
  sortOrder: Joi.string().valid("asc", "desc").optional(),
});
exports.getAllNotifications = async (req, res) => {
  // const page = parseInt(req.query.page, 10) || 1;
  // const limit = parseInt(req.query.limit, 10) || 10;
  // const offset = (page - 1) * limit;
  // const notifications = await knex
  //   .select()
  //   .offset(offset)
  //   .limit(limit)
  //   .from("notificationType");

  // if (notifications.length === 0) {
  //   return res
  //     .status(StatusCodes.NOT_FOUND)
  //     .send("No notification types found");
  // }

  // return res.send(notifications);

  const { error, value } = validateQuery.validate(req.query);

  if (error) {
    return res.status(StatusCodes.BAD_REQUEST).send(error.details[0].message);
  }

  const {
    page = 1,
    limit = 10,
    sortBy = "name",
    sortOrder = "asc",
    ...query
  } = value;

  delete query.page;
  delete query.limit;

  const countQuery = knex
    .count("* as total")
    .where(query)
    .from("notificationType");
  const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

  let notificationsQuery = knex
    .select()
    .offset(offset)
    .limit(limit)
    .where(query)
    .from("notificationType");

  if (sortBy) {
    // If sortBy is provided in the query, add orderBy clause
    notificationsQuery = notificationsQuery.orderBy(sortBy, sortOrder);
  }
  // Fetch the events from the database
  const [notifications, totalCount] = await Promise.all([
    notificationsQuery,
    countQuery,
  ]);

  if (notifications.length === 0) {
    return res.status(StatusCodes.NOT_FOUND).send("No notifications found");
  }

  return res.send({ TotalCount: totalCount[0].total, notifications });
};

exports.getNotificationById = async (req, res) => {
  const { id } = req.params;

  const notification = await knex
    .from("notificationType")
    .where({ id })
    .first();

  if (!notification) {
    return res
      .status(StatusCodes.NOT_FOUND)
      .send("The notification with the given ID is not found");
  }

  return res.send(notification);
};

async function extractAndAssociateTags(templateBody) {
  const pattern = /\{(.*?)\}/g;

  const extractedTags = [...templateBody.matchAll(pattern)].map(
    (match) => match[1]
  );

  try {
    await Promise.all(
      Array.from(extractedTags).map(async (tag) => {
        const existingTag = await knex
          .from("tags")
          .where({ label: tag })
          .first();

        if (!existingTag) {
          await knex.from("tags").insert({ label: tag });
          debug(`Tag '${tag}' saved successfully.`);
        } else {
          debug(`Tag '${tag}' already exists in the table.`);
        }
      })
    );
  } catch (ex) {
    debug("Error associating tags:", ex);
    throw ex;
  }

  return Array.from(extractedTags);
}

exports.create = async (req, res) => {
  const { event_id, name, description, template_subject, template_body } =
    req.body;

  const existingEvent = await knex
    .from("event")
    .where({ id: event_id })
    .first();

  if (!existingEvent) {
    return res.status(StatusCodes.NOT_FOUND).send("Event not found");
  }

  // Convert the notification name to lowercase for case-insensitive comparison
  const lowerCaseName = name.toLowerCase();

  const existingNotification = await knex
    .from("notificationType")
    .whereRaw("LOWER(name) = ? AND event_id = ?", [lowerCaseName, event_id]) // Convert to lowercase for comparison
    .first();

  if (existingNotification) {
    return res
      .status(StatusCodes.CONFLICT)
      .send("A notification with the same name already exists for the event");
  }

  const tags = await extractAndAssociateTags(template_body);

  const notification = await knex
    .from("notificationType")
    .insert({
      name,
      description,
      template_subject,
      template_body,
      event_id,
      tags,
    })
    .returning("*");

  return res.send(notification[0]);
};

exports.update = async (req, res) => {
  const { name, description, template_subject, template_body, event_id } =
    req.body;
  const { id } = req.params;

  const existingEvent = await knex
    .from("event")
    .where({ id: event_id })
    .first();
  if (!existingEvent)
    return res.status(StatusCodes.NOT_FOUND).send("Event not found");

  const existingNotification = await knex
    .from("notificationType")
    .where({ event_id, name })
    .whereNot({ id })
    .first();
  if (existingNotification)
    return res
      .status(StatusCodes.CONFLICT)
      .send("A notification with the same name already exists for the event");

  const tags = await extractAndAssociateTags(template_body);

  const updatedNotification = await knex
    .from("notificationType")
    .where({ id })
    .update({
      name,
      description,
      template_subject,
      template_body,
      event_id,
      tags,
    })
    .returning("*");

  if (updatedNotification.length === 0)
    return res
      .status(StatusCodes.NOT_FOUND)
      .send("The notification with given ID is not found");

  return res.send(updatedNotification[0]);
};

exports.patch = async (req, res) => {
  const {
    name,
    description,
    template_subject,
    template_body,
    event_id,
    isActive,
  } = req.body;
  const { id } = req.params;

  // Check if the notification with the given ID exists
  const currentNotification = await knex
    .from("notificationType")
    .where({ id })
    .first();

  if (!currentNotification) {
    return res
      .status(StatusCodes.NOT_FOUND)
      .send("The notification with the given ID is not found");
  }

  // Convert the notification name to lowercase for case-insensitive comparison
  const lowerCaseName = name.toLowerCase();

  // Create an updatedNotification object with the merged data
  const updatedNotification = {
    name: name || currentNotification.name,
    description: description || currentNotification.description,
    template_subject: template_subject || currentNotification.template_subject,
    template_body: template_body || currentNotification.template_body,
    event_id: event_id || currentNotification.event_id,
    isActive:
      isActive === undefined ? currentNotification.isActive : Boolean(isActive),
  };

  // Check if the template_body is provided or use the currentNotification's template_body
  if (template_body) {
    updatedNotification.tags = await extractAndAssociateTags(template_body);
  } else {
    updatedNotification.tags = currentNotification.tags;
  }

  // Check if the event with the given event_id exists
  const existingEvent = await knex
    .from("event")
    .where({ id: updatedNotification.event_id })
    .first();
  if (!existingEvent) {
    return res.status(StatusCodes.NOT_FOUND).send("Event not found");
  }

  // Check if there's any other notification with the same name and event_id
  const existingNotification = await knex
    .from("notificationType")
    .whereRaw("LOWER(name) = ? AND event_id = ? AND id <> ?", [
      lowerCaseName,
      updatedNotification.event_id,
      id,
    ]) // Convert to lowercase for comparison
    .first();

  if (existingNotification) {
    return res
      .status(StatusCodes.CONFLICT)
      .send("A notification with the same name already exists for the event");
  }

  // Update the notification with the given ID and the provided fields
  const [updatedNotificationFromDB] = await knex
    .from("notificationType")
    .where({ id })
    .update(updatedNotification)
    .returning("*");

  if (!updatedNotificationFromDB) {
    return res
      .status(StatusCodes.NOT_FOUND)
      .send("The notification with the given ID is not found");
  }

  return res.send(updatedNotificationFromDB);
};

exports.delete = async (req, res) => {
  const { id } = req.params;

  const deletedNotification = await knex
    .from("notificationType")
    .where({ id })
    .first();

  if (!deletedNotification || deletedNotification.length === 0) {
    return res
      .status(StatusCodes.NOT_FOUND)
      .send("The notification with the given ID is not found");
  }

  await knex.from("notificationType").where({ id }).del();

  return res.send(deletedNotification);
};
