/* eslint-disable no-underscore-dangle */
const { StatusCodes } = require("http-status-codes");
const { Message, validate } = require("../models/messages");
const { NotificationType } = require("../models/notificationType");
const { Application } = require("../models/applications");
const { Event } = require("../models/events");

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
exports.readAll = async (req, res) => {
  const message = await Message.find();
  return res.send(message);
};

exports.read = async (req, res) => {
  const message = await Message.findById(req.params.id);
  if (!message)
    return res
      .status(StatusCodes.NOT_FOUND)
      .send("The message with given ID is not found");
  return res.send(message);
};

exports.delete = async (req, res) => {
  const message = await Message.findByIdAndRemove(req.params.id);
  if (!message)
    return res
      .status(StatusCodes.NOT_FOUND)
      .send("The message with given ID is not found");
  return res.send(message);
};

exports.create = async (req, res) => {
  const { error } = validate(req.body);
  if (error)
    return res.status(StatusCodes.BAD_REQUEST).send(error.details[0].message);

  const { applicationName, eventName, notificationTypeName, tags } = req.body;

  const application = await Application.findOne({ name: applicationName });
  if (!application)
    return res.status(StatusCodes.NOT_FOUND).send("Application not found");
  const event = await Event.findOne({
    name: eventName,
    application: application._id,
  });
  if (!event)
    return res
      .status(StatusCodes.NOT_FOUND)
      .send("Event not found for the given application");
  const notificationType = await NotificationType.findOne({
    name: notificationTypeName,
    event: event._id,
  });
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
  const message = new Message({
    text: replaceTags(notificationType.template_body, tags),
    notificationType: notificationType._id,
  });

  await message.save();
  return res.send(message);
};
