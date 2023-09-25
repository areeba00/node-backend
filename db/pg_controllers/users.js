const bcrypt = require("bcrypt");
const { StatusCodes } = require("http-status-codes");
const Joi = require("joi");
const knex = require("../knex");
const authUtils = require("../../middleware/authUtils");

const validateUser = function (user) {
  const schema = Joi.object({
    name: Joi.string().min(3).required(),
    email: Joi.string().min(5).max(255).email().required(),
    password: Joi.string().min(5).max(255).required(),
  });
  return schema.validate(user);
};
exports.getAllUsers = async (req, res) => {
  const users = await knex("users").select("id", "name", "email");

  if (users.length === 0) {
    return res.status(StatusCodes.NOT_FOUND).send("No users found");
  }
  return res.send(users);
};
exports.create = async (req, res) => {
  const { error } = validateUser(req.body);
  if (error)
    return res.status(StatusCodes.BAD_REQUEST).send(error.details[0].message);

  const user = await knex("users").where({ email: req.body.email }).first();
  if (user)
    return res.status(StatusCodes.BAD_REQUEST).send("User already registered");

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(req.body.password, salt);

  const [createdUser] = await knex("users")
    .insert({
      name: req.body.name,
      email: req.body.email,
      password: hashedPassword,
    })
    .returning(["id", "name", "email"]);

  const token = authUtils.generateAuthToken(createdUser.id);
  return res.header("x-auth-token", token).send({
    id: createdUser.id,
    name: createdUser.name,
    email: createdUser.email,
  });
};

exports.validateUser = validateUser;
