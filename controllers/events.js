/* eslint-disable no-underscore-dangle */
const { StatusCodes } = require("http-status-codes");
const Joi = require("joi");
const { Event, validate } = require("../models/events");
const { Application } = require("../models/applications");

const validateQuery = Joi.object({
  name: Joi.string().min(3).optional(),
  page: Joi.number().optional(),
  limit: Joi.number().optional(),
  application_id: Joi.number().optional(),
});

exports.getAllEvents = async (req, res) => {
  // const event = await Event.find();
  // return res.send(event);

  const { error, value } = validateQuery.validate(req.query);

  if (error) {
    return res.status(StatusCodes.BAD_REQUEST).send(error.details[0].message);
  }

  const { page = 1, limit = 100, ...query } = value;

  const totalCount = await Event.countDocuments(query);

  const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

  // Find the applications matching the query with pagination
  const events = await Event.find(query).skip(offset).limit(limit).toArray();
  if (events.length === 0) {
    return res.status(StatusCodes.NOT_FOUND).send("No events found");
  }

  return res.send({ TotalCount: totalCount, events });
};

exports.getEventById = async (req, res) => {
  const event = await Event.findById(req.params.id);
  if (!event)
    return res
      .status(StatusCodes.NOT_FOUND)
      .send("The event with given ID is not found");
  return res.send(event);
};

exports.create = async (req, res) => {
  const { error } = validate(req.body);
  if (error)
    return res.status(StatusCodes.BAD_REQUEST).send(error.details[0].message);

  const { name, description, applicationId } = req.body;

  const existingEvent = await Event.findOne({
    name,
    application: applicationId,
  });
  if (existingEvent)
    return res
      .status(StatusCodes.CONFLICT)
      .send("An event with the same name already exists for the application");

  const application = await Application.findById(applicationId);
  if (!application)
    return res.status(StatusCodes.NOT_FOUND).send("Application not found");

  let event = new Event({
    name,
    description,
    application: applicationId,
  });

  event = await event.save();
  return res.send(event);
};

exports.update = async (req, res) => {
  const { error } = validate(req.body);
  if (error)
    return res.status(StatusCodes.BAD_REQUEST).send(error.details[0].message);

  const application = await Application.findById(req.body.application);
  if (!application)
    return res.status(StatusCodes.NOT_FOUND).send("Application not found");
  const event = await Event.findByIdAndUpdate(
    req.params.id,
    {
      name: req.body.name,
      description: req.body.description,
      application: application._id,
    },
    { new: true }
  );
  if (!event)
    return res
      .status(StatusCodes.NOT_FOUND)
      .send("The event with given ID is not found");
  return res.send(event);
};

exports.patch = async (req, res) => {
  const { id } = req.params;

  const existingEvent = await Event.findById(id);

  if (!existingEvent) {
    return res
      .status(StatusCodes.NOT_FOUND)
      .send("The event with the given ID is not found");
  }

  const { name, description } = req.body;
  const updatedEvent = {
    name: name || existingEvent.name,
    description: description || existingEvent.description,
  };

  const event = await Event.findByIdAndUpdate(id, updatedEvent, {
    new: true,
  });

  return res.send(event);
};

exports.delete = async (req, res) => {
  const event = await Event.findByIdAndRemove(req.params.id);
  if (!event)
    return res
      .status(StatusCodes.NOT_FOUND)
      .send("The event with given ID is not found");
  return res.send(event);
};
