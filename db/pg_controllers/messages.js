const { StatusCodes } = require("http-status-codes");
const Joi = require("joi");
const knex = require("../knex");

exports.validateMessage = function (message) {
  const schema = Joi.object({
    applicationName: Joi.string().required(),
    eventName: Joi.string().required(),
    notificationTypeName: Joi.string().required(),
    tags: Joi.object().required(),
  });
  return schema.validate(message);
};
function replaceTags(template, tags) {
  return Object.entries(tags).reduce((acc, [tag, value]) => {
    const tagRegex = new RegExp(`{${tag}}`, "g");
    return acc.replace(tagRegex, value);
  }, template);
}

// function to get missing tags
function getMissingTags(templateBody, tags) {
  const pattern = /\{(.*?)\}/g;
  const extractedTags = [...templateBody.matchAll(pattern)].map(
    (match) => match[1]
  );

  const missingTags = extractedTags.filter(
    (tag) => !Object.prototype.hasOwnProperty.call(tags, tag)
  );
  return missingTags;
}

exports.getAllMessages = async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const offset = (page - 1) * limit;
  const messages = await knex
    .select()
    .offset(offset)
    .limit(limit)
    .from("message");
  if (messages.length === 0) {
    return res.status(StatusCodes.NOT_FOUND).send("No messages found");
  }
  return res.send(messages);
};
exports.getMessageById = async (req, res) => {
  const { id } = req.params;
  const message = await knex.from("message").where({ id }).first();
  if (!message) {
    return res
      .status(StatusCodes.NOT_FOUND)
      .send("The message with the given ID is not found");
  }
  return res.send(message);
};

exports.delete = async (req, res) => {
  const { id } = req.params;

  const deletedMessage = await knex.from("message").where({ id }).first();

  if (!deletedMessage || deletedMessage.length === 0) {
    return res
      .status(StatusCodes.NOT_FOUND)
      .send("The message with the given ID is not found");
  }

  await knex.from("message").where({ id }).del();

  return res.send(deletedMessage);
};

exports.create = async (req, res) => {
  const { applicationName, eventName, notificationTypeName, tags } = req.body;

  const application = await knex
    .from("application")
    .where({ name: applicationName })
    .first();
  if (!application)
    return res.status(StatusCodes.NOT_FOUND).send("Application not found");

  const event = await knex
    .from("event")
    .where({ name: eventName, application_id: application.id })
    .first();
  if (!event)
    return res
      .status(StatusCodes.NOT_FOUND)
      .send("Event not found for the given application");

  const notificationType = await knex
    .from("notificationType")
    .where({ name: notificationTypeName, event_id: event.id })
    .first();
  if (!notificationType)
    return res
      .status(StatusCodes.NOT_FOUND)
      .send("Notification type not found for the given event");

  // Check if tags in the request body are complete
  const missingTags = getMissingTags(notificationType.template_body, tags);
  if (missingTags.length > 0) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .send(`Tags are incomplete. Missing tags: ${missingTags.join(", ")}`);
  }

  const message = {
    text: replaceTags(notificationType.template_body, tags),
    notificationType_id: notificationType.id,
  };

  const [createdMessage] = await knex
    .from("message")
    .insert(message)
    .returning("*");
  return res.send(createdMessage);
};
