const mongoose = require("mongoose");
const Joi = require("joi");

const applicationSchema = new mongoose.Schema({
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
  },
});

function validateApplication(application) {
  const schema = Joi.object({
    name: Joi.string().min(3).required(),
    description: Joi.string().min(5).required(),
  });
  return Joi.validate(application, schema);
}
const Application = mongoose.model("Application", applicationSchema);

module.exports = {
  Application,
  validate: validateApplication,
};
