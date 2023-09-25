// const environment = process.env.NODE_ENV || "development";
const config = require("../knexfile")[process.env.NODE_ENV];

module.exports = require("knex")(config);
