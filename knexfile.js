/**
 * @type { Object.<string, import("knex").Knex.Config> }
 */
const config = require("config");

module.exports = {
  development: {
    client: "postgresql",
    connection: {
      host: config.connection.host,
      port: config.connection.port,
      user: config.connection.user,
      password: config.connection.password,
      database: config.connection.devDb,
    },
    migrations: {
      directory: `${__dirname}/db/migrations`,
    },
    seeds: {
      directory: `${__dirname}/db/seeds`,
    },
  },
  test: {
    client: "postgresql",
    connection: {
      host: config.connection.host,
      port: config.connection.port,
      user: config.connection.user,
      password: config.connection.password,
      database: config.connection.testDb,
    },
    migrations: {
      directory: `${__dirname}/db/migrations`,
    },
    seeds: {
      directory: `${__dirname}/db/seeds`,
    },
  },
};
