/* eslint-disable camelcase */
const { StatusCodes } = require("http-status-codes");
const Joi = require("joi");
const knex = require("../knex");

exports.validateEvent = function (event) {
  const schema = Joi.object({
    name: Joi.string().min(3).max(50).required(),
    description: Joi.string().min(5).max(200).required(),
    application_id: Joi.number().required(),
    isActive: Joi.boolean(),
  });
  return schema.validate(event);
};

const validateQuery = Joi.object({
  name: Joi.string().min(3).optional(),
  page: Joi.number().optional(),
  limit: Joi.number().optional(),
  application_id: Joi.number().optional(),
  isActive: Joi.boolean().optional(),
  sortBy: Joi.string().valid("name", "created_at", "updated_at").optional(),
  sortOrder: Joi.string().valid("asc", "desc").optional(),
});

exports.getAllEvents = async (req, res) => {
  const { error, value } = validateQuery.validate(req.query);

  if (error) {
    return res.status(StatusCodes.BAD_REQUEST).send(error.details[0].message);
  }

  const {
    page = 1,
    limit = 100,
    sortBy = "name",
    sortOrder = "asc",
    ...query
  } = value;

  delete query.page;
  delete query.limit;

  const countQuery = knex.count("* as total").where(query).from("event");
  const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

  let eventsQuery = knex
    .select()
    .offset(offset)
    .limit(limit)
    .where(query)
    .from("event");

  if (sortBy) {
    // If sortBy is provided in the query, add orderBy clause
    eventsQuery = eventsQuery.orderBy(sortBy, sortOrder);
  }
  // Fetch the events from the database
  const [events, totalCount] = await Promise.all([eventsQuery, countQuery]);

  if (events.length === 0) {
    return res.status(StatusCodes.NOT_FOUND).send("No events found");
  }

  return res.send({ TotalCount: totalCount[0].total, events });
};

exports.getEventById = async (req, res) => {
  const { id } = req.params;

  const event = await knex.from("event").where({ id }).first();

  if (!event) {
    return res
      .status(StatusCodes.NOT_FOUND)
      .send("The event with the given ID is not found");
  }

  return res.send(event);
};

exports.create = async (req, res) => {
  const { name, description, application_id } = req.body;

  // Convert the event name to lowercase for case-insensitive comparison
  const lowerCaseName = name.toLowerCase();

  const existingEvent = await knex
    .from("event")
    .whereRaw("LOWER(name) = ? AND application_id = ?", [
      lowerCaseName,
      application_id,
    ]) // Convert to lowercase for comparison
    .first();

  if (existingEvent) {
    return res
      .status(StatusCodes.CONFLICT)
      .send("An event with the same name already exists for the application");
  }

  const application = await knex
    .from("application")
    .where("id", application_id)
    .first();

  if (!application) {
    return res.status(StatusCodes.NOT_FOUND).send("Application not found");
  }

  const event = await knex
    .from("event")
    .insert({
      name,
      description,
      application_id,
    })
    .returning("*");

  return res.send(event[0]);
};

exports.update = async (req, res) => {
  const { name, description, application_id, isActive } = req.body;
  const { id } = req.params;

  // Convert the event name to lowercase for case-insensitive comparison
  const lowerCaseName = name.toLowerCase();

  // Check if there's any other event with the same name and application_id
  const existingEvent = await knex
    .from("event")
    .whereRaw("LOWER(name) = ? AND application_id = ? AND id != ?", [
      lowerCaseName,
      application_id,
      id,
    ]) // Convert to lowercase for comparison
    .first();

  if (existingEvent) {
    return res
      .status(StatusCodes.CONFLICT)
      .send("An event with the same name already exists for the application");
  }

  // Check if the application with the given ID exists
  const application = await knex
    .from("application")
    .where({ id: application_id })
    .first();

  if (!application) {
    return res.status(StatusCodes.NOT_FOUND).send("Application not found");
  }

  // Update the event with the given ID
  const updatedEvent = await knex
    .from("event")
    .where({ id })
    .update({ name, description, application_id, isActive })
    .returning("*");

  if (!updatedEvent || updatedEvent.length === 0) {
    return res
      .status(StatusCodes.NOT_FOUND)
      .send("The event with the given ID is not found");
  }

  return res.send(updatedEvent[0]);
};

exports.patch = async (req, res) => {
  const { name, description, application_id, isActive } = req.body;
  const { id } = req.params;

  // Get the current event data from the database
  const currentEvent = await knex.from("event").where({ id }).first();

  if (!currentEvent) {
    return res
      .status(StatusCodes.NOT_FOUND)
      .send("The event with the given ID is not found");
  }

  // Create an updatedEvent object with the merged data
  const updatedEvent = {
    name: name || currentEvent.name,
    description: description || currentEvent.description,
    isActive:
      isActive === undefined ? currentEvent.isActive : Boolean(isActive),
  };

  // Check if there's any other event with the same name and application_id
  if (
    application_id !== undefined &&
    application_id !== currentEvent.application_id
  ) {
    const existingEvent = await knex
      .from("event")
      .where({ name: updatedEvent.name, application_id })
      .whereNot({ id })
      .first();

    if (existingEvent) {
      return res
        .status(StatusCodes.CONFLICT)
        .send("An event with the same name already exists for the application");
    }

    // Check if the application with the given ID exists
    const application = await knex
      .from("application")
      .where({ id: application_id })
      .first();

    if (!application) {
      return res.status(StatusCodes.NOT_FOUND).send("Application not found");
    }

    updatedEvent.application_id = application_id;
  } else {
    // Retain the current application_id if not provided or not changed
    updatedEvent.application_id = currentEvent.application_id;
  }

  // Update the event with the given ID and the provided fields
  const [updatedEventFromDB] = await knex
    .from("event")
    .where({ id })
    .update(updatedEvent)
    .returning("*");

  if (!updatedEventFromDB) {
    return res
      .status(StatusCodes.NOT_FOUND)
      .send("The event with the given ID is not found");
  }

  return res.send(updatedEventFromDB);
};

exports.delete = async (req, res) => {
  const { id } = req.params;

  const event = await knex.from("event").where({ id }).first();

  if (!event || event.length === 0)
    return res
      .status(StatusCodes.NOT_FOUND)
      .send("The event with the given ID is not found");
  await knex.from("event").where({ id }).del();

  return res.send(event);
};
