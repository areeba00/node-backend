const config = require("config");

module.exports = function () {
  if (!config.get("jwtprivatekey")) {
    throw new Error("Fatal error: private key not defined");
  }
};
