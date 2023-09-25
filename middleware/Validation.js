/* eslint-disable consistent-return */
const { StatusCodes } = require("http-status-codes");
const { validateApplication } = require("../db/pg_controllers/applications");
const { validateEvent } = require("../db/pg_controllers/events");
const {
  validateNotification,
} = require("../db/pg_controllers/notificationType");
const { validateMessage } = require("../db/pg_controllers/messages");
const { validateUser } = require("../db/pg_controllers/users");
const { validateAuth } = require("../db/pg_controllers/auth");

const validateApplicationMiddleware = (req, res, next) => {
  const { error } = validateApplication(req.body);
  if (error) {
    return res.status(StatusCodes.BAD_REQUEST).send(error.details[0].message);
  }
  next();
};

const validateEventMiddleware = (req, res, next) => {
  const { error } = validateEvent(req.body);
  if (error) {
    return res.status(StatusCodes.BAD_REQUEST).send(error.details[0].message);
  }
  next();
};

const validateNotificationTypeMiddleware = (req, res, next) => {
  const { error } = validateNotification(req.body);
  if (error) {
    return res.status(StatusCodes.BAD_REQUEST).send(error.details[0].message);
  }
  next();
};

const validateMessageMiddleware = (req, res, next) => {
  const { error } = validateMessage(req.body);
  if (error) {
    return res.status(StatusCodes.BAD_REQUEST).send(error.details[0].message);
  }
  next();
};

const validateUserMiddleware = (req, res, next) => {
  const { error } = validateUser(req.body);
  if (error) {
    return res.status(StatusCodes.BAD_REQUEST).send(error.details[0].message);
  }
  next();
};

const validateAuthMiddleware = (req, res, next) => {
  const { error } = validateAuth(req.body);
  if (error) {
    return res.status(StatusCodes.BAD_REQUEST).send(error.details[0].message);
  }
  next();
};

exports.validateApplication = validateApplicationMiddleware;
exports.validateEvent = validateEventMiddleware;
exports.validateNotificationType = validateNotificationTypeMiddleware;
exports.validateMessage = validateMessageMiddleware;
exports.validateUser = validateUserMiddleware;
exports.validateAuth = validateAuthMiddleware;
