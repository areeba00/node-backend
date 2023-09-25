const winston = require("winston");

module.exports = function () {
  const fileTransport = new winston.transports.File({
    filename: "logfile.log",
  });

  winston.add(fileTransport);

  winston.exceptions.handle(
    new winston.transports.File({ filename: "uncaughtExceptions.log" })
  );

  process.on("unhandledRejection", (ex) => {
    throw ex;
  });
};
