/* eslint-disable no-unused-vars */
const { StatusCodes } = require("http-status-codes");
const { v4: uuidv4 } = require("uuid");

const config = require("config");

const loggerLevel = config.get("logging.level");
const traceId = uuidv4();
const { createLogger, format, transports } = require("winston");

const { combine, timestamp, printf } = format;

// const customFormat = printf(
//   ({ timestamp, level, message, stack }) =>
//     `[${timestamp}] [${level}] ${message}${stack ? `\n${stack}` : ""}`
// );

const fileTransport = new transports.File({ filename: "logfile.log" });

const logger = createLogger({
  format: combine(
    format.printf(({ id, level, traceID, message, stack }) =>
      JSON.stringify({ id, level, traceID, message, stack })
    )
  ),
  transports: [fileTransport],
  level: loggerLevel,
});
module.exports = {
  errorMiddleware(err, req, res, next) {
    const traceID = req.headers["x-trace-id"];
    const message = {
      id: Date.now(),
      level: loggerLevel,
      traceID,
      message: err.message,
      stack: err.stack,
    };
    logger.error(message);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .send("Unable to process your requests");
  },
  logger,
};
