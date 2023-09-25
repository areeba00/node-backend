const bcrypt = require("bcrypt");
const Joi = require("joi");
const knex = require("../knex");
const authUtils = require("../../middleware/authUtils");

exports.validateAuth = function (req) {
  const schema = Joi.object({
    email: Joi.string().min(5).max(255).email().required(),
    password: Joi.string().min(5).max(255).required(),
  });
  return schema.validate(req);
};

exports.create = async (req, res) => {
  const user = await knex("users").where({ email: req.body.email }).first();
  if (!user) return res.status(400).send("Invalid email or password");

  const validPassword = await bcrypt.compare(req.body.password, user.password);
  if (!validPassword) return res.status(400).send("Invalid email or password");

  const token = authUtils.generateAuthToken(user.id);
  // return res.send(token);
  return res.json({ token });
};
