/* eslint-disable no-underscore-dangle */
const lodash = require("lodash");
const bcrypt = require("bcrypt");
const { StatusCodes } = require("http-status-codes");
const { User, validate } = require("../models/users");

exports.readAll = async (req, res) => {
  const user = await User.findById(req.user._id).select("-password");
  res.send(user);
};
exports.create = async (req, res) => {
  const { error } = validate(req.body);
  if (error)
    return res.status(StatusCodes.BAD_REQUEST).send(error.details[0].message);

  let user = await User.findOne({ email: req.body.email });
  if (user)
    return res.status(StatusCodes.BAD_REQUEST).send("User already registered");

  user = new User(
    lodash.pick(req.body, ["name", "email", "password", "isAdmin"])
  );
  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(user.password, salt);
  user = await user.save();

  const token = user.generateAuthToken();
  return res
    .header("x-auth-token", token)
    .send(lodash.pick(user, ["_id", "name", "email"]));
};
