const mongoose = require("mongoose");
const Joi = require("joi");
const { Application } = require("./applications");

const Event = mongoose.model(
  "Event",
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
    application: {
      type: mongoose.Schema.Types.ObjectId,
      ref: Application,
    },
  })
);

function validateEvent(event) {
  const schema = Joi.object({
    name: Joi.string().min(3).required(),
    description: Joi.string().min(5).required(),
    applicationId: Joi.string()
      .regex(/^[0-9a-fA-F]{24}$/)
      .required(),
  });
  return Joi.validate(event, schema);
}

exports.Event = Event;
exports.validate = validateEvent;
