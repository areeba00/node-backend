const mongoose = require("mongoose");
const Joi = require("joi");
const jwt = require("jsonwebtoken");
const config = require("config");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    minLength: 3,
    maxLength: 50,
  },

  email: {
    type: String,
    required: true,
    unique: true,
    minLength: 3,
    maxLength: 255,
  },
  password: {
    type: String,
    required: true,
    minLength: 3,
    maxLength: 1024,
  },
  isAdmin: {
    type: Boolean,
  },
});
userSchema.methods.generateAuthToken = function () {
  const token = jwt.sign(
    { _id: this._id, isAdmin: this.isAdmin },
    config.get("jwtprivatekey")
  );
  return token;
};
function validateUser(user) {
  const schema = Joi.object({
    name: Joi.string().min(3).required(),
    email: Joi.string().min(5).max(255).email().required(),
    password: Joi.string().min(5).max(255).required(),
    isAdmin: Joi.boolean(),
  });
  return Joi.validate(user, schema);
}
const User = mongoose.model("User", userSchema);

module.exports = {
  User,
  validate: validateUser,
};
