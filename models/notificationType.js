const mongoose = require("mongoose");
const Joi = require("joi");
const { Event } = require("./events");

const NotificationType = mongoose.model(
  "notificationType",
  new mongoose.Schema({
    name: {
      type: String,
      required: true,
      minLength: 3,
      maxLength: 50,
    },

    description: {
      type: String,
      required: true,
      minLength: 3,
      maxLength: 50,
    },
    template_subject: {
      type: String,
      required: true,
      minLength: 3,
    },
    template_body: {
      type: String,
      required: true,
      minLength: 3,
    },
    tags: {
      type: [String],
    },
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: Event,
    },
  })
);

function validateNotification(notification) {
  const schema = Joi.object({
    name: Joi.string().min(3).required(),
    description: Joi.string().min(5).required(),
    template_subject: Joi.string().min(5).required(),
    template_body: Joi.string().min(5).required(),
    event: Joi.string()
      .regex(/^[0-9a-fA-F]{24}$/)
      .required(),
  });
  return Joi.validate(notification, schema);
}

exports.NotificationType = NotificationType;
exports.validate = validateNotification;
