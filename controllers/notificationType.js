/* eslint-disable no-underscore-dangle */
const { StatusCodes } = require("http-status-codes");
const debug = require("debug");
const { NotificationType, validate } = require("../models/notificationType");
const { Event } = require("../models/events");
const { Tags } = require("../models/tags");

exports.readAll = async (req, res) => {
  const notification = await NotificationType.find();
  return res.send(notification);
};

exports.read = async (req, res) => {
  const notification = await NotificationType.findById(req.params.id);
  if (!notification)
    return res
      .status(StatusCodes.NOT_FOUND)
      .send("The notification with given ID is not found");
  return res.send(notification);
};

async function extractAndAssociateTags(templateBody, Table) {
  const pattern = /\{(.*?)\}/g;
  // const extractedTags = new Set();

  const extractedTags = [...templateBody.matchAll(pattern)].map(
    (match) => match[1]
  );
  // Associate the extracted tags with the provided table (e.g., Tags table)
  try {
    await Promise.all(
      Array.from(extractedTags).map(async (tag) => {
        const existingTag = await Table.findOne({ name: tag });

        if (!existingTag) {
          const newTag = new Table({ name: tag });
          await newTag.save();
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
  const { error } = validate(req.body);
  if (error)
    return res.status(StatusCodes.BAD_REQUEST).send(error.details[0].message);

  const event = await Event.findById(req.body.event);
  if (!event) return res.status(StatusCodes.NOT_FOUND).send("Event not found");
  const notificationName = req.body.name;
  const templateBody = req.body.template_body;
  // Check if an existing notification of the same name exists for the eventID
  const existingNotification = await NotificationType.findOne({
    event: event._id,
    name: notificationName,
  });

  if (existingNotification) {
    return res
      .status(StatusCodes.CONFLICT)
      .send("A notification with the same name already exists for the event");
  }

  // Extract and associate tags with the Tags table
  const tags = await extractAndAssociateTags(templateBody, Tags);

  // Create the notification
  const notification = new NotificationType({
    name: req.body.name,
    description: req.body.description,
    template_subject: req.body.template_subject,
    template_body: templateBody,
    event: event._id,
    tags,
  });

  // Save the notification
  const savedNotification = await notification.save();
  return res.send(savedNotification);
};

exports.update = async (req, res) => {
  const { error } = validate(req.body);
  if (error)
    return res.status(StatusCodes.BAD_REQUEST).send(error.details[0].message);

  // const notificationName = req.body.name;
  const templateBody = req.body.template_body;

  const event = await Event.findById(req.body.event);
  if (!event) return res.status(StatusCodes.NOT_FOUND).send("Event not found");

  // // Check if an existing notification of the same name exists for the eventID
  const existingNotification = await NotificationType.findOne({
    event: event._id,
    name: req.body.name,
  });

  if (existingNotification) {
    return res
      .status(StatusCodes.CONFLICT)
      .send("A notification with the same name already exists for the event");
  }
  // Extract and associate tags with the Tags table
  const tags = await extractAndAssociateTags(templateBody, Tags);

  const notification = await NotificationType.findByIdAndUpdate(
    req.params.id,
    {
      name: req.body.name,
      description: req.body.description,
      template_subject: req.body.template_subject,
      template_body: req.body.template_body,
      tags,
      event: event._id,
    },
    { new: true }
  );
  if (!notification)
    return res
      .status(StatusCodes.NOT_FOUND)
      .send("The notification with given ID is not found");
  return res.send(notification);
};

exports.delete = async (req, res) => {
  const notification = await NotificationType.findByIdAndRemove(req.params.id);
  if (!notification)
    return res
      .status(StatusCodes.NOT_FOUND)
      .send("The notification with given ID is not found");
  return res.send(notification);
};
