const mongoose = require("mongoose");
const config = require("config");
const debug = require("debug");

module.exports = function () {
  mongoose
    .connect(config.db.mongoURI, config.db.options)
    .then(() => debug("Connected to the database"));
};
