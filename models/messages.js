const mongoose = require("mongoose");
const Joi = require("joi");
const { NotificationType } = require("./notificationType");

const Message = mongoose.model(
  "Message",
  new mongoose.Schema({
    text: {
      type: String,
      required: true,
      minLength: 3,
    },
    notificationType: {
      type: mongoose.Schema.Types.ObjectId,
      ref: NotificationType,
    },
  })
);

function validateMessage(message) {
  const schema = Joi.object({
    text: Joi.string().min(3).required(),
    applicationName: Joi.string().required(),
    eventName: Joi.string().required(),
    notificationTypeName: Joi.string().required(),
    notificationType: Joi.string()
      .regex(/^[0-9a-fA-F]{24}$/)
      .required(),
  });
  return Joi.validate(message, schema);
}

exports.Message = Message;
exports.validate = validateMessage;
