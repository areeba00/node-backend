require("dotenv").config();
require("express-async-errors");
const express = require("express");
const config = require("config");
require("winston-mongodb");

const app = express();
require("./startup/logging")();
require("./startup/routes")(app);
// require("./startup/db")();
require("./startup/config")();

const port = config.has("port") ? config.get("port") : 3000;
const server = app.listen(port);
module.exports = server;
